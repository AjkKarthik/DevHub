import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-confirming-implicit-conversion-claim-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './confirming-not-trusting-the-implicit-conversion-claim.html',
  styleUrl: './confirming-not-trusting-the-implicit-conversion-claim.scss',
})
export class ConfirmingNotTrustingTheImplicitConversionClaimSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Tells You What to Look For, Not How to Look',
      points: [
        'The main page\'s own comment on WHERE account_code = 123 says to "look for CONVERT_IMPLICIT warning nodes in the plan XML or SSMS plan viewer" — but never actually shows what that looks like or how to extract it. Trusting a claim like this at face value, without ever having confirmed it against a real plan, means you would not recognize the warning if you saw it, and would not know how to check a query you are actually worried about.',
        'SET STATISTICS XML ON (or SET SHOWPLAN_XML ON to see the plan without executing) captures the actual execution plan as XML. Searching that XML for <Convert ... ImplicitConversion="1" ...> confirms, concretely, that the column-side conversion the main page describes is really happening for this specific query — not just asserted as a general fact.',
      ],
    },
    {
      heading: 'Why INT Always Outranks VARCHAR — and Why PostgreSQL Refuses to Guess',
      points: [
        'SQL Server\'s documented data type precedence ranks numeric types (int, bigint, decimal, and others) above character types (varchar, char) universally — a string column compared against ANY numeric literal always has the STRING side implicitly converted, regardless of which specific numeric type is involved. This is a stronger, more absolute rule than the varchar/nvarchar precedence relationship (where nvarchar merely outranks varchar) — strings always lose to numbers in MSSQL.',
        'PostgreSQL takes a fundamentally different approach: comparing a text/varchar column to an integer literal does not implicitly convert anything — it raises a parse-time error, operator does not exist: character varying = integer, before the query ever runs. The identical mistake that silently degrades performance in MSSQL is caught immediately and loudly in PostgreSQL, at the cost of needing an explicit cast for any genuinely intentional cross-type comparison.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — capturing and reading the actual plan XML',
      language: 'sql',
      code: `SET STATISTICS XML ON;

SELECT * FROM accounts WHERE account_code = 123;   -- account_code is VARCHAR

SET STATISTICS XML OFF;

-- In the returned plan XML, search for:
--   <ScalarOperator ScalarString="CONVERT_IMPLICIT(varchar(20),[accounts].[account_code],0)=(123)" />
-- or, in a Convert element:
--   <Convert DataType="varchar" Length="20" Style="0" ImplicitConversion="1" .../>
-- Either confirms the VARCHAR column is being wrapped in an implicit
-- conversion for every row -- not a guess, an observed fact in this plan.

-- Graphical plan equivalent: the SELECT operator shows a yellow warning
-- triangle; hovering shows "Type conversion in expression ... may affect
-- 'CardinalityEstimate' in query plan choice" -- the same warning, in
-- SSMS's UI instead of raw XML.`,
    },
    {
      label: 'PostgreSQL — the same mistake is a loud error, not a silent scan',
      language: 'sql',
      code: `-- account_code is VARCHAR/text in PostgreSQL:
SELECT * FROM accounts WHERE account_code = 123;
-- ERROR:  operator does not exist: character varying = integer
-- HINT:   No operator matches the given name and argument types.
--         You might need to add explicit type casts.

-- PostgreSQL never silently converts text to integer for comparison --
-- the mistake is caught immediately, at parse time, before any rows
-- are scanned. The fix is the same explicit cast either way:
SELECT * FROM accounts WHERE account_code = '123';  -- correct in both dialects`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate insists a specific MSSQL query is "definitely not affected by implicit conversion" because the query runs fast in their testing. Using the plan-XML technique above, how would you actually confirm or refute that claim for this specific query, rather than relying on observed speed?',
    hint: 'A query can run fast on a small or well-cached test table even with an implicit conversion silently forcing a scan -- speed alone does not prove the plan avoided the conversion.',
    solution: `Run SET STATISTICS XML ON before executing the specific query, capture
the returned plan XML, and search it for a <Convert ...
ImplicitConversion="1" .../> element (or the equivalent
CONVERT_IMPLICIT(...) inside a ScalarOperator's ScalarString). If that
element appears wrapped around a column reference, the conversion is
happening for this query, regardless of how fast it currently runs --
a small test table, a warm cache, or a table that happens to fit
entirely in the buffer pool can all make a full scan feel "fast" while
still being non-sargable and much more expensive at production scale.

Observed speed on a test table is not evidence either way -- the plan
XML is the actual, authoritative record of what the engine did for
that specific query, and is the only way to confirm or refute the
claim with certainty rather than relying on an anecdotal timing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s guidance to "look for CONVERT_IMPLICIT warning nodes" is enough on its own -- you\'ll recognize it if you ever see it in a real plan.',
      reality: 'without having actually looked at a captured plan XML at least once, most people would not recognize the exact element name (<Convert ... ImplicitConversion="1" .../>) or know which tool (SET STATISTICS XML, SSMS graphical plan, sys.dm_exec_query_plan) to use to find it.',
    },
    {
      thought: 'a query running fast in testing is good evidence that it is not affected by an implicit conversion.',
      reality: 'a small or well-cached test table can make even a non-sargable full scan feel fast -- the plan XML is the only authoritative way to confirm whether an implicit conversion is actually present, independent of observed timing.',
    },
    {
      thought: 'PostgreSQL handles the exact same VARCHAR-vs-integer comparison the same way MSSQL does, just with different function names.',
      reality: 'PostgreSQL does not implicitly convert text to integer at all for this kind of comparison -- it raises a parse-time error (operator does not exist) instead of silently degrading performance, a fundamentally different (and in this case, safer) behavior than MSSQL\'s.',
    },
  ];
}
