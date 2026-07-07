import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-batched-update-no-match-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-batched-update-example-never-finds-a-matching-row.html',
  styleUrl: './testing-that-the-batched-update-example-never-finds-a-matching-row.scss',
})
export class TestingThatTheBatchedUpdateExampleNeverFindsAMatchingRowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Examples, One Shared WHERE Predicate',
      points: [
        'The "MSSQL batched DELETE/UPDATE" code tab presents two examples in the same tab, one after the other: a batched DELETE with WHILE @deleted > 0 { DELETE TOP (@batch) FROM orders WHERE order_date < \'2020-01-01\' AND status = \'Cancelled\'; ... }, immediately followed by a comment "-- Batched UPDATE" and a batched UPDATE with the identical filter: WHERE order_date < \'2020-01-01\' AND status = \'Cancelled\' AND status <> \'Archived\'.',
        'Both loops target the exact same rows — order_date before 2020-01-01 AND status = \'Cancelled\'. They are presented as two illustrative, independent alternatives ("here is how you batch a DELETE; here is how you batch an UPDATE"), but nothing in the code tab or its surrounding comments tells a reader they should be run against separate result sets, or that running the tab top-to-bottom will empty the very rows the second loop is looking for.',
      ],
    },
    {
      heading: 'What Happens Running the Tab Top-to-Bottom',
      points: [
        'The DELETE loop runs first and, by design, removes every row matching order_date < \'2020-01-01\' AND status = \'Cancelled\' — the WHILE @deleted > 0 loop only stops once zero rows remain matching that predicate.',
        'By the time execution reaches the UPDATE loop just below it, zero rows anywhere in the table still satisfy status = \'Cancelled\' AND order_date < \'2020-01-01\' — they were all deleted. UPDATE TOP (10000) orders SET status = \'Archived\' WHERE ... immediately finds @@ROWCOUNT = 0, the WHILE @updated > 0 loop body never executes a second time, and the "Archived" status is never actually applied to anything.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s exact sequence',
      language: 'sql',
      code: `-- Seed data: 500 cancelled orders from 2019
INSERT INTO orders (order_id, customer_id, amount, order_date, status)
SELECT n, 1, 50.00, '2019-06-01', 'Cancelled'
FROM   generate_series(1, 500) AS n;   -- (PostgreSQL syntax; adapt for MSSQL test data)

-- Statement 1: the main page's batched DELETE, run first
DECLARE @batch INT = 10000;
DECLARE @deleted INT = 1;
WHILE @deleted > 0
BEGIN
    DELETE TOP (@batch) FROM orders
    WHERE order_date < '2020-01-01' AND status = 'Cancelled';
    SET @deleted = @@ROWCOUNT;
END;
-- Removes all 500 seeded rows -- @deleted ends at 0.

-- Statement 2: the main page's batched UPDATE, run immediately after
DECLARE @updated INT = 1;
WHILE @updated > 0
BEGIN
    UPDATE TOP (10000) orders
    SET    status = 'Archived'
    WHERE  order_date < '2020-01-01'
      AND  status = 'Cancelled'
      AND  status <> 'Archived';
    SET @updated = @@ROWCOUNT;
END;
-- @@ROWCOUNT is 0 on the FIRST iteration -- loop body never runs
-- a second time, and zero rows are ever set to 'Archived'.`,
    },
    {
      label: 'Confirming with SELECT COUNT(*) between the two loops',
      language: 'sql',
      code: `SELECT COUNT(*) FROM orders
WHERE order_date < '2020-01-01' AND status = 'Cancelled';
-- 0  -- the DELETE loop above already removed every matching row

-- Running the UPDATE loop from here is provably a no-op --
-- it is scanning for rows that cannot exist anymore.`,
    },
    {
      label: 'Making the two examples independent — the likely intent',
      language: 'sql',
      code: `-- If DELETE and UPDATE were meant to be genuinely separate
-- alternatives (e.g. "delete really old cancellations, but archive
-- more recent ones instead"), they need DIFFERENT, non-overlapping
-- predicates -- for example, splitting by an additional date cutoff:

-- Delete only cancellations older than 2018:
DELETE TOP (@batch) FROM orders
WHERE order_date < '2018-01-01' AND status = 'Cancelled';

-- Archive (don't delete) cancellations from 2018-2019:
UPDATE TOP (10000) orders
SET    status = 'Archived'
WHERE  order_date >= '2018-01-01' AND order_date < '2020-01-01'
  AND  status = 'Cancelled';
-- Now the two loops operate on disjoint row sets and both do real work.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s full "MSSQL batched DELETE/UPDATE" code tab into a maintenance script and runs it nightly, expecting old cancelled orders to end up with status \'Archived\'. After running it for a week, they notice the orders table has fewer and fewer old cancelled rows, but none are ever marked \'Archived\'. Why?',
    hint: 'Compare the WHERE clause of the DELETE loop to the WHERE clause of the UPDATE loop that follows it in the same code tab.',
    solution: `Both loops target the identical predicate: order_date < '2020-01-01'
AND status = 'Cancelled'. Since the DELETE loop runs first and
removes every row matching that predicate (that is what a WHILE
@deleted > 0 loop does -- it keeps deleting until none remain), the
UPDATE loop that follows never finds anything to update. Old
cancelled orders are being deleted, exactly as the DELETE loop is
designed to do -- but the UPDATE loop's "Archived" status is never
applied to anything, because by the time it runs, its target rows
no longer exist.

The fix is to give the two loops non-overlapping predicates (e.g.
DELETE only very old rows, UPDATE a more recent range) as shown
above, or to only run whichever ONE of the two loops actually
matches the intended policy -- treating them as two illustrative,
mutually exclusive alternatives rather than a sequential pipeline.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code tab presenting a batched DELETE followed by a batched UPDATE example is showing a two-step pipeline meant to be run in that order.',
      reality: 'here they are two independent, illustrative alternatives that happen to share the same WHERE predicate — running them sequentially means the first one consumes every row the second one is looking for.',
    },
    {
      thought: 'a WHILE loop that exits immediately with @@ROWCOUNT = 0 always indicates a bug in the loop\'s own logic (a typo in the predicate, a wrong variable, etc.).',
      reality: 'it can just as easily mean the loop\'s target rows were legitimately removed by an earlier, unrelated statement — as demonstrated here, the UPDATE loop\'s logic is correct in isolation; the problem is purely about statement order and predicate overlap.',
    },
    {
      thought: 'two SQL examples appearing back-to-back in the same code tab, under one heading, are safe to copy and run together exactly as written.',
      reality: 'illustrative code tabs on a reference page often show multiple independent techniques for comparison, not a tested end-to-end script — always check whether adjacent examples share state (like a WHERE predicate) before running them in sequence.',
    },
  ];
}
