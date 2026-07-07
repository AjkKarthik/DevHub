import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-confirming-twice-referenced-cte-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './confirming-that-a-twice-referenced-cte-actually-executes-twice.html',
  styleUrl: './confirming-that-a-twice-referenced-cte-actually-executes-twice.scss',
})
export class ConfirmingThatATwiceReferencedCteActuallyExecutesTwiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Comment Is Not Evidence',
      points: [
        'The main page\'s own "CTE vs Temp Table" code tab states, via a comment only: "CTE referenced TWICE — may execute twice in SQL Server." Nothing on the page shows what evidence would actually confirm this — a reader is asked to trust the claim rather than verify it against a real execution plan or IO statistics.',
        'SET STATISTICS IO ON reveals the logical read count for every table touched by a query. If the CTE genuinely re-executes for each reference, the underlying Orders table\'s logical read count in the resulting output will be roughly DOUBLE what a single-reference query against the same aggregation would show — since each reference incurs its own full GROUP BY scan over Orders.',
      ],
    },
    {
      heading: 'The Temp Table Fix\'s Benefit Is Just as Measurable',
      points: [
        'The same technique confirms the main page\'s own recommended fix: materializing the aggregation into a #temp table causes Orders to be scanned exactly once (regardless of how many times #CustomerStats is subsequently referenced), with each further reference reading cheaply from the small, indexed #CustomerStats table instead of re-scanning Orders.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the CTE double-execution with SET STATISTICS IO',
      language: 'sql',
      code: `SET STATISTICS IO ON;

-- Baseline: single reference to the CTE
WITH ExpensiveAggregation AS (
    SELECT CustomerID, SUM(Freight) AS TotalFreight, COUNT(*) AS OrderCount
    FROM Orders
    GROUP BY CustomerID
)
SELECT * FROM ExpensiveAggregation WHERE TotalFreight > 1000;
-- Table 'Orders'. Scan count 1, logical reads N   <- baseline: ONE scan

-- The main page's own "referenced TWICE" version:
WITH ExpensiveAggregation AS (
    SELECT CustomerID, SUM(Freight) AS TotalFreight, COUNT(*) AS OrderCount
    FROM Orders
    GROUP BY CustomerID
)
SELECT ea1.CustomerID, ea1.TotalFreight
FROM ExpensiveAggregation ea1
WHERE ea1.TotalFreight > (
    SELECT AVG(TotalFreight) FROM ExpensiveAggregation
);
-- Table 'Orders'. Scan count 2, logical reads ~2N  <- roughly DOUBLE the
-- baseline's logical reads -- confirms the CTE's underlying query ran
-- twice, exactly as the main page's own comment claims (now verified,
-- not just trusted).

SET STATISTICS IO OFF;`,
    },
    {
      label: 'Confirming the temp table fix reduces this back to a single scan',
      language: 'sql',
      code: `SET STATISTICS IO ON;

SELECT CustomerID, SUM(Freight) AS TotalFreight, COUNT(*) AS OrderCount
INTO #CustomerStats
FROM Orders
GROUP BY CustomerID;
-- Table 'Orders'. Scan count 1, logical reads N   <- ONE scan, materialised

CREATE INDEX IX_CustomerStats ON #CustomerStats (CustomerID);

SELECT cs.CustomerID, cs.TotalFreight
FROM #CustomerStats cs
WHERE cs.TotalFreight > (SELECT AVG(TotalFreight) FROM #CustomerStats);
-- Table '#CustomerStats'. Scan count 2, logical reads (small, cheap)
-- Table 'Orders' does NOT appear again at all in this second query --
-- both references now read the small, indexed temp table instead of
-- re-scanning the full Orders table a second time.

SET STATISTICS IO OFF;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate is skeptical of the main page\'s "may execute twice" comment and argues that modern query optimizers are smart enough to recognize a CTE is referenced twice and automatically compute it once. Using the pattern above, how would you settle this specific disagreement with evidence rather than opinion, and what result would prove which side is right?',
    hint: 'The question is answerable directly from a single piece of SQL Server output — look for what SET STATISTICS IO actually reports about the Orders table specifically.',
    solution: `Run the twice-referenced CTE query with SET STATISTICS IO ON and
compare the Orders table's logical read count against a baseline query
that references the same aggregation only once. If the optimizer
really does compute the CTE once and reuse it (as the skeptical
teammate believes), the Orders table's logical reads in the
twice-referenced version would match the single-reference baseline. If
the CTE genuinely re-executes per reference (as the main page's own
comment claims), the Orders table's logical reads would be roughly
double the baseline.

This is a directly falsifiable, evidence-based way to settle the
disagreement -- rather than debating what the optimizer "should" do in
theory, the STATISTICS IO output shows what it ACTUALLY did for this
specific query, on this specific SQL Server version, which is the only
way to know for certain without guessing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a claim about database internals presented as a plain comment in reference material (like "CTE referenced TWICE — may execute twice") is either obviously true or obviously false, and doesn\'t need independent verification.',
      reality: 'claims about query engine internals can vary by version, configuration, and specific query shape — the only way to know for certain is to check the actual execution plan or IO statistics for your specific case, not to accept or dismiss the claim on faith.',
    },
    {
      thought: 'modern SQL Server versions are advanced enough to always recognize and deduplicate a CTE referenced multiple times in the same statement, making the main page\'s warning outdated.',
      reality: 'SQL Server CTEs are not guaranteed to be materialised — the SET STATISTICS IO evidence directly shows the underlying table being scanned roughly twice for a twice-referenced CTE, confirming the main page\'s claim rather than refuting it.',
    },
    {
      thought: 'SET STATISTICS IO only reports storage-engine-level detail useful for advanced performance tuning, not something relevant to verifying a beginner-level claim about CTEs.',
      reality: 'SET STATISTICS IO is one of the simplest, most direct tools available for confirming exactly this kind of claim — a single before/after comparison of logical reads settles the question with concrete evidence in a couple of lines of SQL.',
    },
  ];
}
