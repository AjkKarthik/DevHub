import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-or-union-all-no-duplicates-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-or-to-union-all-rewrite-doesnt-duplicate-overlapping-rows.html',
  styleUrl: './testing-that-the-or-to-union-all-rewrite-doesnt-duplicate-overlapping-rows.scss',
})
export class TestingThatTheOrToUnionAllRewriteDoesntDuplicateOverlappingRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Exclusion Clause Is Correct — But Never Proven',
      points: [
        'The main page\'s own OR-to-UNION-ALL rewrite for WHERE CategoryID = 1 OR SupplierID = 3 correctly adds AND CategoryID <> 1 to the second branch — but never explains WHY that exclusion is necessary, nor demonstrates what breaks without it. A reader copying the general PATTERN ("split an OR into two UNION ALL branches, one per condition") without noticing this specific detail is likely to omit it, since it looks like an unrelated extra filter rather than an essential part of the rewrite.',
        'UNION ALL, unlike UNION, does NOT deduplicate its combined result. A product satisfying BOTH CategoryID = 1 AND SupplierID = 3 simultaneously would be captured by the first branch (CategoryID = 1) AND — without the exclusion — ALSO captured by a naive second branch (SupplierID = 3 alone), appearing TWICE in the final result. This is exactly why the second branch needs AND CategoryID <> 1: it excludes rows already captured by the first branch, ensuring each qualifying row appears exactly once.',
      ],
    },
    {
      heading: 'Proving Equivalence With the Original Query',
      points: [
        'The correct rewrite should return EXACTLY the same set of rows as the original WHERE CategoryID = 1 OR SupplierID = 3 query — no more, no fewer. An EXCEPT-based comparison between the original OR query and the UNION ALL rewrite is empty only when the two are truly equivalent, confirming the rewrite preserves the original query\'s meaning rather than just resembling it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the correct rewrite is equivalent to the original OR query',
      language: 'sql',
      code: `-- Fixture: a product satisfying BOTH conditions simultaneously
INSERT INTO Products (ProductID, ProductName, CategoryID, SupplierID) VALUES
  (1, 'Widget', 1, 3),    -- CategoryID = 1 AND SupplierID = 3 -- the overlap case
  (2, 'Gadget', 1, 9),    -- CategoryID = 1 only
  (3, 'Gizmo',  5, 3);    -- SupplierID = 3 only

-- Original query
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1 OR SupplierID = 3;
-- Returns 3 rows: Widget, Gadget, Gizmo (each exactly once)

-- The main page's own correct rewrite -- prove it's equivalent via EXCEPT
-- (empty result on both sides means no rows differ either direction):
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1
EXCEPT
(SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1
 UNION ALL
 SELECT ProductID, ProductName FROM Products WHERE SupplierID = 3 AND CategoryID <> 1);
-- Empty -- confirms the rewrite is a faithful equivalent, not just a
-- resemblance, of the original OR query.`,
    },
    {
      label: 'Reproducing the naive mistake — omitting the exclusion',
      language: 'sql',
      code: `-- The natural-looking but WRONG rewrite -- forgetting the exclusion:
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1
UNION ALL
SELECT ProductID, ProductName FROM Products WHERE SupplierID = 3;  -- missing "AND CategoryID <> 1"

-- Returns 4 rows: Widget, Gadget, Widget (again!), Gizmo
-- Widget (ProductID 1) appears TWICE -- once from each branch, since
-- it satisfies BOTH CategoryID = 1 (first branch) and SupplierID = 3
-- (second branch), and UNION ALL never deduplicates.

-- Confirm the divergence directly:
(SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1
 UNION ALL
 SELECT ProductID, ProductName FROM Products WHERE SupplierID = 3)
EXCEPT
SELECT ProductID, ProductName FROM Products WHERE CategoryID = 1 OR SupplierID = 3;
-- Still empty (EXCEPT compares DISTINCT sets, hiding the duplicate) --
-- but a COUNT(*) comparison reveals the real problem:
SELECT COUNT(*) FROM (
    SELECT ProductID FROM Products WHERE CategoryID = 1
    UNION ALL
    SELECT ProductID FROM Products WHERE SupplierID = 3
) t;   -- returns 4, not 3 -- the row-count mismatch is the actual tell`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A report built on a naive OR-to-UNION-ALL rewrite (missing the exclusion clause) shows a "total products matching category or supplier filter" count that is consistently a few rows higher than a separately-computed reference count using the original OR query. Using the technique above, explain how you would confirm this is a duplication bug rather than a data discrepancy, and identify exactly which rows are affected.',
    hint: 'An EXCEPT-based comparison between two queries hides duplicates, since EXCEPT operates on DISTINCT row sets — think about what comparison actually reveals a duplicate-row problem.',
    solution: `A plain EXCEPT comparison between the two queries would NOT reveal
this bug, because EXCEPT implicitly compares DISTINCT sets of rows --
a duplicated row still "matches" once, hiding the duplication. The
correct diagnostic is a COUNT(*) comparison: if the UNION ALL
rewrite's row count is higher than the original OR query's row count
(when there should be no difference), that gap directly indicates
duplicate rows exist. The size of the gap tells you exactly how many
rows are being double-counted.

To identify exactly which rows are duplicated, use GROUP BY ProductID
HAVING COUNT(*) > 1 against the UNION ALL result -- this lists every
product that satisfies BOTH branch conditions simultaneously
(CategoryID = 1 AND SupplierID = 3 in this fixture's case), which is
precisely the overlap the missing exclusion clause was supposed to
prevent from being double-counted.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own AND CategoryID <> 1 clause in the second UNION ALL branch is just an incidental extra filter that could be safely omitted for a "simpler" version of the same rewrite.',
      reality: 'that exclusion is the entire mechanism preventing duplicate rows for products that satisfy BOTH original OR conditions simultaneously — omitting it silently duplicates every such row, since UNION ALL never deduplicates.',
    },
    {
      thought: 'comparing an original query against its rewritten version using EXCEPT is always sufficient to confirm the rewrite is correct.',
      reality: 'EXCEPT compares DISTINCT row sets, so it cannot detect a rewrite that returns the SAME rows but with some of them duplicated — a row-count comparison (or an explicit GROUP BY ... HAVING COUNT(*) > 1 check) is needed to catch that specific class of bug.',
    },
    {
      thought: 'a UNION ALL query returning "too many rows" compared to expectations is most likely caused by a WHERE clause being too permissive, not by the UNION ALL structure itself.',
      reality: 'a row-count inflation in a UNION ALL rewrite of an OR condition is a strong signal of exactly this overlap-duplication pattern — worth checking before assuming the WHERE clause logic itself is at fault.',
    },
  ];
}
