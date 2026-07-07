import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-count-distinct-alternative-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-count-distinct-alternative-returns-identical-counts.html',
  styleUrl: './testing-that-the-count-distinct-alternative-returns-identical-counts.scss',
})
export class TestingThatTheCountDistinctAlternativeReturnsIdenticalCountsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Faster" Is Not the Same Claim as "Correct" — Prove Both',
      points: [
        'The main page\'s own Q&A recommends replacing COUNT(DISTINCT col) with a pre-deduplicated CTE for performance: WITH d AS (SELECT DISTINCT group_col, counted_col FROM t) SELECT group_col, COUNT(*) FROM d GROUP BY group_col. It never proves this alternative returns the SAME result as the original COUNT(DISTINCT) query on the same data — a subtle bug in the dedup CTE (deduping on the wrong column, or omitting the grouping column from the DISTINCT list) would silently produce a DIFFERENT count while still running successfully and looking plausible.',
        'A test built on a tiny, hand-verifiable fixture makes the correct answer obvious: one category, one customer who placed 3 orders in that category, so the correct unique-customer count is exactly 1. Asserting both the original COUNT(DISTINCT) query AND the "faster" alternative return 1 on this fixture proves they are equivalent, not just that the alternative runs without error.',
      ],
    },
    {
      heading: 'A Missing Column in the DISTINCT List Is the Realistic Failure Mode',
      points: [
        'The specific bug worth guarding against: if the dedup CTE\'s DISTINCT list omits the GROUP BY column (e.g. SELECT DISTINCT customer_id FROM ... instead of SELECT DISTINCT category_id, customer_id FROM ...), the same customer who ordered from multiple categories gets deduplicated globally instead of per category — collapsing what should be several per-category counts into one, and silently undercounting every category the customer touched more than once across categories.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — pgTAP proving equivalence on a small fixture',
      language: 'sql',
      code: `BEGIN;
SELECT plan(2);

-- Fixture: category 1, customer 7 places 3 orders in that category
INSERT INTO orders (order_id, category_id, customer_id) VALUES
  (1, 1, 7), (2, 1, 7), (3, 1, 7);

-- Original: COUNT(DISTINCT customer_id) -- correct, but the pattern
-- the main page suggests replacing for performance
SELECT is(
  (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE category_id = 1)::int,
  1,
  'COUNT(DISTINCT) correctly counts 1 unique customer'
);

-- The main page's own "faster" alternative -- must return the SAME value
SELECT is(
  (WITH d AS (SELECT DISTINCT category_id, customer_id FROM orders)
   SELECT COUNT(*) FROM d WHERE category_id = 1)::int,
  1,
  'pre-dedup CTE alternative matches COUNT(DISTINCT) exactly'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
    {
      label: 'Reproducing the realistic bug — DISTINCT list missing the group column',
      language: 'sql',
      code: `-- Extend the fixture: the SAME customer 7 also orders in category 2
INSERT INTO orders (order_id, category_id, customer_id) VALUES (4, 2, 7);

-- Correct dedup CTE -- DISTINCT on BOTH the group column and the counted column:
WITH d_correct AS (SELECT DISTINCT category_id, customer_id FROM orders)
SELECT category_id, COUNT(*) AS unique_customers
FROM d_correct GROUP BY category_id;
-- category 1 -> 1, category 2 -> 1 (correct: customer 7 counted once per category)

-- BUGGY dedup CTE -- DISTINCT omits category_id from the list:
WITH d_buggy AS (
    SELECT DISTINCT customer_id FROM orders   -- missing category_id!
)
SELECT o.category_id, COUNT(DISTINCT d_buggy.customer_id) AS unique_customers
FROM orders o JOIN d_buggy ON d_buggy.customer_id = o.customer_id
GROUP BY o.category_id;
-- Runs without error, but the dedup happened GLOBALLY before the join,
-- not per category -- for larger fixtures this silently under- or
-- over-counts depending on exact query shape, with no error raised.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate applies the main page\'s own "pre-deduplicate in a CTE" performance fix to a slow COUNT(DISTINCT customer_id) query, but writes the dedup CTE as <code>SELECT DISTINCT customer_id FROM orders</code> — without including the category_id grouping column in the DISTINCT list. The query runs successfully and the numbers look plausible. Using the test pattern above, how would you catch this specific mistake, and what would the assertion actually reveal?',
    hint: 'Think about what "deduplicate customer_id" means when it is NOT also deduplicated per the grouping column — what happens to a customer who ordered from more than one category?',
    solution: `A test comparing the original COUNT(DISTINCT customer_id) result against
the "faster" alternative's result, on a fixture where the SAME customer
appears in more than one category, would catch this immediately: the
buggy version dedupes customer_id globally before ever considering
category, so a customer appearing in multiple categories is only
represented once across the whole dedup set, corrupting the per-category
join and producing counts that no longer match the original
COUNT(DISTINCT) query for at least one of the affected categories.

The assertion reveals the mismatch directly and unambiguously — rather
than requiring someone to notice that a specific category's
"unique customers" figure looks slightly off in a live dashboard,
which is exactly the kind of subtle, easy-to-miss regression this test
pattern exists to catch.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once a query returns a plausible-looking number without any error, a "performance fix" like replacing COUNT(DISTINCT) with a pre-dedup CTE can be trusted to be correct.',
      reality: 'a subtly wrong dedup CTE (e.g. missing the grouping column from the DISTINCT list) runs without error and produces a plausible but WRONG number — only a comparison against the original query\'s result, on a known fixture, can confirm the two are actually equivalent.',
    },
    {
      thought: 'deduplicating just the "counted" column (e.g. customer_id) in a CTE is always equivalent to COUNT(DISTINCT customer_id) grouped by some other column.',
      reality: 'the DISTINCT list must include the GROUP BY column as well — deduping customer_id alone, globally, collapses a customer who appears in multiple groups into a single row, which then either disappears from or misattributes to the wrong group once joined back.',
    },
    {
      thought: 'this class of bug is unlikely to matter in practice because it would produce an obviously wrong, wildly different number.',
      reality: 'the resulting counts are typically SLIGHTLY off, not wildly wrong — plausible enough to pass a casual glance at a dashboard, which is exactly what makes it dangerous without an explicit equivalence test.',
    },
  ];
}
