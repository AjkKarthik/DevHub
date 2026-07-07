import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-confirming-except-vs-not-exists-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './confirming-that-except-materialises-both-sets-not-exists-short-circuits.html',
  styleUrl: './confirming-that-except-materialises-both-sets-not-exists-short-circuits.scss',
})
export class ConfirmingThatExceptMaterialisesBothSetsNotExistsShortCircuitsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Correct Quiz Answer Is Never Backed by Evidence',
      points: [
        'The main page\'s own quiz states, as the correct answer: "EXCEPT materialises both result sets then computes the set difference; NOT EXISTS is evaluated row by row and can short-circuit — NOT EXISTS is often faster for selective filters." This is presented as the right answer to memorize, with no execution plan or IO measurement anywhere on the page to back it up.',
        'The claim is directly checkable: capture SET STATISTICS IO output and the actual execution plan for equivalent EXCEPT and NOT EXISTS queries solving the identical "products never ordered" scenario, then compare the operators and logical reads each one produces.',
      ],
    },
    {
      heading: 'The Divergence Is Sharpest With a Selective Outer Set',
      points: [
        'The performance gap between the two approaches is most visible when the outer (left) set is small and highly selective while the inner (right) set is large — NOT EXISTS can stop scanning the inner set as soon as it finds one matching row per outer row (a Nested Loops Anti Semi Join, index-assisted), while EXCEPT must fully materialise and sort or hash BOTH complete result sets before it can compute the difference, regardless of how selective the outer set actually is.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Comparing logical reads — EXCEPT vs NOT EXISTS on the same scenario',
      language: 'sql',
      code: `-- Setup: a small, highly selective Products table (100 rows) and a
-- large OrderItems table (10 million rows) with an index on ProductID
CREATE INDEX IX_OrderItems_ProductID ON OrderItems (ProductID);

SET STATISTICS IO ON;

-- The main page's own EXCEPT version:
SELECT ProductID FROM Products
EXCEPT
SELECT DISTINCT ProductID FROM OrderItems;
-- Table 'OrderItems'. Scan count 1, logical reads: HIGH -- reads the
-- entire (or a large index-covering scan of the) OrderItems table to
-- build its side of the set difference, regardless of how few
-- Products rows there are to check against.

-- The NOT EXISTS equivalent:
SELECT ProductID FROM Products p
WHERE NOT EXISTS (
    SELECT 1 FROM OrderItems oi WHERE oi.ProductID = p.ProductID
);
-- Table 'OrderItems'. Scan count 100 (once per Products row), logical
-- reads: LOW per scan -- each lookup uses the index to check for a
-- match and stops immediately, rather than reading the whole table.

SET STATISTICS IO OFF;`,
    },
    {
      label: 'Confirming the operator difference in the execution plan',
      language: 'sql',
      code: `-- Capture the actual plan for each query (SET STATISTICS XML ON, or
-- "Include Actual Execution Plan" in SSMS):

-- EXCEPT plan: shows a Merge Join (Right Anti Semi Join) or Hash Match
-- (Right Anti Semi Join), fed by TWO separate scans/sorts of the full
-- Products and OrderItems inputs -- both sides must be fully read and
-- ordered/hashed before the set difference can be computed.

-- NOT EXISTS plan: shows a Nested Loops (Left Anti Semi Join), with
-- Products as the OUTER (driving) input and an Index Seek into
-- OrderItems as the INNER side -- for each Products row, the seek
-- looks for ONE matching OrderItems row and stops as soon as it finds
-- one (or confirms none exist), never scanning the rest of the index
-- for that ProductID.

-- The operator names differ (Merge/Hash Anti Semi Join vs Nested
-- Loops Anti Semi Join), directly confirming the main page's own
-- quiz answer -- materialise-both-then-diff vs row-by-row
-- short-circuit -- rather than requiring it to be taken on faith.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A report using the main page\'s own EXCEPT-based "products never ordered" query runs noticeably slower after the OrderItems table grows from 1 million to 50 million rows, even though the Products table (100 rows) and the actual number of unordered products haven\'t changed at all. A teammate proposes switching to NOT EXISTS and claims it will scale better. Using the mechanics above, explain why the EXCEPT version\'s runtime is sensitive to OrderItems\' total size in a way NOT EXISTS\'s runtime would not be.',
    hint: 'Think about what EXCEPT has to read from OrderItems BEFORE it can even start computing the set difference, versus what NOT EXISTS reads per Products row.',
    solution: `EXCEPT must fully materialise its RIGHT-hand input (the DISTINCT
ProductID list from OrderItems) before it can compute the set
difference against the LEFT-hand Products list -- this means its work
scales with the TOTAL SIZE of OrderItems, regardless of how selective
or small the Products side is. Growing OrderItems from 1 million to 50
million rows directly increases the amount of data EXCEPT must read
and process, even though the actual answer (which products were never
ordered) hasn't changed.

NOT EXISTS, by contrast, drives from the small Products table (100
rows) and, for EACH row, does an index-assisted lookup into
OrderItems that stops as soon as it finds one match (or confirms
none exist) -- its total work scales with the size of the OUTER
(Products) set times a roughly constant per-row lookup cost, not with
the total size of OrderItems. This is exactly why the teammate's
proposal is well-founded: switching to NOT EXISTS should make the
query's runtime largely insensitive to how large OrderItems grows,
provided the ProductID index remains in place.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own quiz answer about EXCEPT materialising both sets while NOT EXISTS short-circuits is a general performance rule of thumb that doesn\'t need to be verified for a specific query — it\'s just how these operators work by definition.',
      reality: 'while the general behavior is accurate, confirming it for a SPECIFIC query and dataset via SET STATISTICS IO and the actual execution plan is what turns a memorized fact into verified, actionable evidence for a real performance decision.',
    },
    {
      thought: 'EXCEPT and NOT EXISTS, since they can express logically equivalent queries, always have comparable performance characteristics regardless of the size or selectivity of the tables involved.',
      reality: 'their performance profiles diverge specifically based on the RELATIVE sizes and selectivity of the two sets — EXCEPT\'s cost scales with the total size of both inputs, while NOT EXISTS\'s cost scales primarily with the outer (driving) set\'s size when a supporting index exists on the inner side.',
    },
    {
      thought: 'a query that gets slower as an unrelated table grows must have a missing index somewhere, rather than being an inherent characteristic of the SET OPERATION chosen.',
      reality: 'the growing-table sensitivity in this scenario is a direct consequence of EXCEPT needing to materialise its entire right-hand input regardless of indexing — adding an index to OrderItems.ProductID would not change this fundamental characteristic of the EXCEPT approach, though it would help the NOT EXISTS alternative.',
    },
  ];
}
