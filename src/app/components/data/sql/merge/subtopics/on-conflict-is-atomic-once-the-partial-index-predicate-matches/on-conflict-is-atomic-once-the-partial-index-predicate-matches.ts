import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-on-conflict-partial-index-atomicity-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './on-conflict-is-atomic-once-the-partial-index-predicate-matches.html',
  styleUrl: './on-conflict-is-atomic-once-the-partial-index-predicate-matches.scss',
})
export class OnConflictIsAtomicOnceThePartialIndexPredicateMatchesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Re-Examining an Overstated Pitfall',
      points: [
        'The main page\'s "Common pitfalls" section states: "PostgreSQL ON CONFLICT DO UPDATE is not truly atomic in all cases with partial indexes — test under concurrency. For the highest safety, use advisory locks or serializable isolation." This frames partial indexes as introducing a concurrency risk that needs extra locking to work around.',
        'That framing is misleading. ON CONFLICT DO UPDATE is fully atomic against a partial unique index, exactly as it is against a regular one — PostgreSQL\'s upsert primitive was specifically designed to avoid the check-then-act race condition regardless of index type. What actually goes wrong with partial indexes is not a concurrency bug — it is a deterministic, always-reproducible SQL error that has nothing to do with timing.',
      ],
    },
    {
      heading: 'The Real Mechanic: Conflict-Target Resolution',
      points: [
        'ON CONFLICT (column) by itself only matches a unique constraint or a FULL (non-partial) unique index on that column. A partial unique index — e.g. CREATE UNIQUE INDEX ON products(product_id) WHERE active = true — is NOT considered by a bare ON CONFLICT (product_id) clause, because Postgres cannot know, from the column list alone, that you intend to target an index with a WHERE predicate.',
        'To target a partial unique index, the ON CONFLICT clause must repeat that index\'s exact predicate: ON CONFLICT (product_id) WHERE active = true DO UPDATE .... Get the predicate wrong or omit it, and Postgres raises a deterministic planning-time error — "there is no unique or exclusion constraint matching the ON CONFLICT specification" — every single time, under any concurrency level, including with a single session and no other activity at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — a partial unique index',
      language: 'sql',
      code: `CREATE TABLE products (
    product_id INT NOT NULL,
    name       TEXT,
    price      NUMERIC(10,2),
    active     BOOLEAN NOT NULL DEFAULT true
);

-- Only ACTIVE products need a unique product_id; retired/archived
-- rows are allowed to reuse an old product_id.
CREATE UNIQUE INDEX products_active_id_uq
    ON products (product_id) WHERE active = true;`,
    },
    {
      label: 'The deterministic error (no concurrency involved at all)',
      language: 'sql',
      code: `-- A single session, nothing else running -- this ALWAYS fails:
INSERT INTO products (product_id, name, price, active)
VALUES (1, 'Widget', 9.99, true)
ON CONFLICT (product_id)          -- missing the WHERE active = true predicate
DO UPDATE SET price = EXCLUDED.price;

-- ERROR:  there is no unique or exclusion constraint matching the
--         ON CONFLICT specification
--
-- This is a planning-time error, thrown before any row is touched.
-- It reproduces 100% of the time -- it is not a race condition, and
-- running it a thousand times sequentially with zero concurrent
-- sessions produces the exact same error every time.`,
    },
    {
      label: 'The fix — and proof it is fully atomic under concurrency',
      language: 'sql',
      code: `-- Matching the partial index's predicate resolves the conflict target:
INSERT INTO products (product_id, name, price, active)
VALUES (1, 'Widget', 9.99, true)
ON CONFLICT (product_id) WHERE active = true
DO UPDATE SET price = EXCLUDED.price;
-- Succeeds -- Postgres now knows exactly which index backs the conflict check.

-- Concurrency test: two sessions racing the SAME upsert.
-- Session A:
BEGIN;
INSERT INTO products (product_id, name, price, active)
VALUES (2, 'Gadget', 19.99, true)
ON CONFLICT (product_id) WHERE active = true
DO UPDATE SET price = EXCLUDED.price
RETURNING xmin;   -- Postgres's internal row-version marker
COMMIT;

-- Session B (run concurrently, before A commits):
INSERT INTO products (product_id, name, price, active)
VALUES (2, 'Gadget', 24.99, true)
ON CONFLICT (product_id) WHERE active = true
DO UPDATE SET price = EXCLUDED.price
RETURNING xmin;
-- Session B blocks until A commits, then proceeds safely -- no
-- duplicate-key error, no lost update, no advisory lock required.
-- Exactly one row ends up in the table with the last writer's price.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s pitfall about ON CONFLICT and partial indexes and adds a <code>pg_advisory_xact_lock(product_id)</code> call before every upsert into the products table "to be safe against the concurrency bug." Based on what the deterministic error above actually shows, is the advisory lock addressing a real risk?',
    hint: 'Does the error in the second code tab depend on timing, another session, or concurrent load in any way?',
    solution: `No -- the advisory lock is solving a problem that doesn't exist. The
error ("no unique or exclusion constraint matching the ON CONFLICT
specification") is thrown by the query planner before execution even
begins, purely because the ON CONFLICT clause's predicate doesn't
match the partial index's predicate. It has nothing to do with
concurrent sessions -- a single session with zero contention hits the
exact same error every time it omits the WHERE clause.

The actual fix is purely syntactic: make the ON CONFLICT clause's
predicate match the partial index's predicate exactly. Once that's
done, ON CONFLICT DO UPDATE is fully atomic under concurrency on its
own, the same as it is against a full unique index -- no advisory
lock, no SERIALIZABLE isolation, and no extra safety mechanism is
needed. Adding one doesn't hurt correctness, but it adds unnecessary
lock contention to fix a bug that was actually a missing WHERE clause.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PostgreSQL\'s ON CONFLICT DO UPDATE becomes unreliable or "not truly atomic" specifically when the target table has a partial unique index, and needs extra locking to be safe.',
      reality: 'ON CONFLICT DO UPDATE is fully atomic against a partial unique index, exactly as it is against a full one. What actually breaks is a syntax mismatch: the ON CONFLICT clause must repeat the partial index\'s WHERE predicate, or Postgres can\'t resolve which index it targets.',
    },
    {
      thought: 'the "no unique or exclusion constraint matching the ON CONFLICT specification" error is an intermittent concurrency failure that only shows up under load.',
      reality: 'it is a deterministic planning-time error that reproduces every single time the ON CONFLICT predicate doesn\'t exactly match an existing unique index\'s predicate -- a single, uncontended session hits it identically to a thousand concurrent ones.',
    },
    {
      thought: 'adding pg_advisory_xact_lock() or SERIALIZABLE isolation around an ON CONFLICT upsert makes it "more correct" whenever a partial index is involved.',
      reality: 'ON CONFLICT DO UPDATE is already Postgres\'s purpose-built atomic upsert primitive -- once the predicate is correctly matched, no additional locking mechanism changes its correctness; it only adds unnecessary contention.',
    },
  ];
}
