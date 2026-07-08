import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-no-sort-needed-claim-broken-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-no-sort-needed-claim-breaks-its-own-leftmost-prefix-rule.html',
  styleUrl: './the-no-sort-needed-claim-breaks-its-own-leftmost-prefix-rule.scss',
})
export class TheNoSortNeededClaimBreaksItsOwnLeftmostPrefixRuleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Query That Skips the Middle Column Cannot Deliver a Globally Sorted Result',
      points: [
        'The main page\'s own IX_Good index is CREATE INDEX IX_Good ON Orders (CustomerID, Status, OrderDate DESC) INCLUDE (Freight). Its own "ORDER BY elimination" example runs WHERE CustomerID = \'ALFKI\' ORDER BY OrderDate DESC — with NO predicate on Status at all — and claims "Uses IX_Good above with no additional Sort step."',
        'Per the main page\'s OWN leftmost-prefix-rule theory, stated earlier in the same topic: a composite index on (A, B, C) only delivers rows pre-sorted by C for queries that pin an equality predicate on B. Without a Status predicate, the B-tree groups this customer\'s rows by Status FIRST, then by OrderDate DESC WITHIN each Status group. A customer\'s orders spanning multiple statuses (Shipped, Pending, Cancelled) are NOT globally sorted by OrderDate across the whole result — they are sorted by OrderDate only within each status block. The engine still needs an explicit Sort operator to satisfy ORDER BY OrderDate DESC across the customer\'s entire order history.',
      ],
    },
    {
      heading: 'The "No Sort" Benefit Genuinely Applies to a Different Query on the Same Page',
      points: [
        'One paragraph earlier in the same code tab, the main page shows exactly the query shape that DOES eliminate the sort: WHERE CustomerID = @c AND Status = \'Shipped\' AND OrderDate >= \'2024-01-01\' — which pins Status as an equality predicate. With Status fixed to a single value, the trailing OrderDate range within that one (CustomerID, Status) group genuinely arrives pre-sorted, and no Sort operator is needed.',
        'The "ORDER BY elimination" example accidentally reuses a query shape that\'s missing the Status predicate the same index actually needs for that specific optimization to apply — the claim and the query shown together don\'t match the page\'s own composite-index rule.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the gap — the main page\'s own query, checked against its own index',
      language: 'sql',
      code: `-- IX_Good, exactly as the main page defines it:
CREATE INDEX IX_Good ON Orders (CustomerID, Status, OrderDate DESC)
    INCLUDE (Freight);

-- A customer with orders in MULTIPLE statuses:
INSERT INTO Orders (OrderID, CustomerID, Status, OrderDate, Freight) VALUES
  (1, 'ALFKI', 'Cancelled', '2024-03-01', 10),
  (2, 'ALFKI', 'Pending',   '2024-05-01', 20),
  (3, 'ALFKI', 'Shipped',   '2024-01-01', 30);

-- The main page's own "ORDER BY elimination" query -- no Status predicate:
SELECT OrderID, OrderDate, Freight
FROM Orders
WHERE CustomerID = 'ALFKI'
ORDER BY OrderDate DESC;
-- Per the index's own key order (CustomerID, Status, OrderDate DESC),
-- the physical B-tree order for this customer is grouped by Status
-- FIRST: Cancelled (2024-03-01), then Pending (2024-05-01), then
-- Shipped (2024-01-01) -- NOT globally descending by OrderDate.
-- The execution plan still shows an explicit Sort operator to produce
-- the requested 2024-05-01, 2024-03-01, 2024-01-01 order -- contrary
-- to the main page's own "no additional Sort step" comment.`,
    },
    {
      label: 'The query shape that genuinely eliminates the sort',
      language: 'sql',
      code: `-- The OTHER query shown earlier in the SAME code tab -- this one DOES
-- pin an equality predicate on Status:
SELECT OrderID, OrderDate, Freight
FROM Orders
WHERE CustomerID = 'ALFKI' AND Status = 'Shipped'
ORDER BY OrderDate DESC;
-- With Status fixed to a single value, the B-tree seeks
-- (CustomerID, Status), then the trailing OrderDate DESC key
-- genuinely delivers pre-sorted rows within that one group --
-- no Sort operator needed. This is the query shape the "no sort"
-- claim actually applies to.

-- If the intent really is "all of a customer's orders, sorted by
-- date, regardless of status," a DIFFERENT index design is needed --
-- one where OrderDate is NOT blocked behind a Status column:
CREATE INDEX IX_CustomerDate ON Orders (CustomerID, OrderDate DESC)
    INCLUDE (Status, Freight);
-- This index correctly eliminates the sort for the exact query the
-- main page's own comment describes, without requiring a Status
-- predicate at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s own "ORDER BY elimination" example verbatim, sees no Status predicate in the query, and concludes that IX_Good (CustomerID, Status, OrderDate DESC) generally eliminates sorting whenever CustomerID is filtered — regardless of Status. They then apply this belief to a DIFFERENT query with a different WHERE clause and are confused when a Sort operator appears in that plan too. What went wrong in their reasoning, and what would they need to check to have caught the mistake earlier?',
    hint: 'Check whether the ORIGINAL example query actually needed a Status predicate for the "no sort" claim to hold — per the page\'s own leftmost-prefix rule.',
    solution: `The developer's reasoning generalized from an example that was itself
inconsistent with the page's own leftmost-prefix rule -- the original
"ORDER BY elimination" query (WHERE CustomerID = 'ALFKI' ORDER BY
OrderDate DESC, no Status predicate) does NOT actually eliminate the
sort, despite the page's comment claiming it does. Believing that
comment led to the false generalization that CustomerID alone is
enough to unlock sort elimination on IX_Good, when in fact a Status
equality predicate is required (as the page's OWN adjacent query
correctly demonstrates) because Status sits between CustomerID and
OrderDate in the index key.

To catch this earlier, the developer should have checked the query
against the page's own leftmost-prefix rule directly: for
IX_Good (CustomerID, Status, OrderDate DESC), the trailing OrderDate
key only delivers pre-sorted output within a SINGLE Status value --
any query that doesn't pin Status to one value will need an explicit
Sort operator to produce a globally date-ordered result across
multiple status groups, regardless of what a comment in reference
material claims.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own comment "Uses IX_Good above with no additional Sort step" on its ORDER BY elimination example is accurate, since it directly follows the index\'s own definition in the same code tab.',
      reality: 'checked against the page\'s own leftmost-prefix rule, this specific query (no Status predicate) does NOT eliminate the sort — the claim contradicts the page\'s own composite-index theory stated just paragraphs earlier.',
    },
    {
      thought: 'a composite index (A, B, C DESC) eliminates sorting on C for any query filtering on A, regardless of whether B is also filtered.',
      reality: 'the trailing key column (C) only arrives pre-sorted WITHIN a single value of the middle column (B) — a query that filters only on A, without pinning B, gets rows grouped by B first, not globally sorted by C.',
    },
    {
      thought: 'if a page\'s own reference example includes an explicit "no Sort step" comment, that claim has necessarily been checked against an actual execution plan before being published.',
      reality: 'comments in reference material can be wrong or inconsistent with the surrounding theory — this specific example is verifiably inconsistent with the very leftmost-prefix rule taught earlier on the same page, and only checking against a real execution plan (or the rule itself) reveals the gap.',
    },
  ];
}
