import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-trigger-subquery-tautology-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-postgresql-trigger-subquery-is-a-tautology.html',
  styleUrl: './testing-that-the-challenges-postgresql-trigger-subquery-is-a-tautology.scss',
})
export class TestingThatTheChallengesPostgresqlTriggerSubqueryIsATautologySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Subquery That Filters Against Itself',
      points: [
        'The challenge\'s PostgreSQL solution is a FOR EACH STATEMENT trigger, meaning it has no direct access to which specific rows the UPDATE just changed (no NEW/OLD, unless a REFERENCING transition table is explicitly declared — which this solution never does). Instead, it filters with: SELECT DISTINCT product_id FROM order_items WHERE order_id IN (SELECT DISTINCT order_id FROM order_items).',
        'Read closely: the inner subquery — SELECT DISTINCT order_id FROM order_items — selects every order_id from the ENTIRE order_items table, with no WHERE clause narrowing it to the rows the current statement just touched. The outer WHERE order_id IN (...) then checks each row\'s order_id against that same complete set — which is always true for every row in the table, since every order_id in order_items is trivially "in" the set of all order_ids from order_items. The filter is a tautology: it excludes nothing.',
      ],
    },
    {
      heading: 'What This Actually Means for the Trigger\'s Behavior',
      points: [
        'Because the filter never narrows anything, the subquery i effectively becomes "every distinct product_id in the entire order_items table" — regardless of which rows the triggering UPDATE actually changed. A single UPDATE affecting one order_item row causes this trigger to re-check EVERY product in the whole table for a low-stock condition, not just the one that changed.',
        'This isn\'t just a performance concern (though it is one — the cost scales with total table size, not with the size of the UPDATE) — it also means the trigger can fire low-stock alerts for products that were NOT touched by the current statement at all, simply because their stock happens to already be below their sold quantity at the moment ANY unrelated row in the table is updated.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the tautology directly',
      language: 'sql',
      code: `CREATE TABLE order_items (item_id INT, order_id INT, product_id INT, qty INT);
INSERT INTO order_items VALUES
    (1, 100, 1, 5),
    (2, 100, 2, 3),
    (3, 200, 3, 10);   -- a completely different order, different product

-- The challenge's own inner subquery, run standalone:
SELECT DISTINCT order_id FROM order_items;
--  order_id
-- ----------
--    100
--    200
-- Every order_id in the ENTIRE table -- not just the one from the
-- triggering UPDATE statement.

-- The outer filter, applied:
SELECT DISTINCT product_id
FROM order_items
WHERE order_id IN (SELECT DISTINCT order_id FROM order_items);
--  product_id
-- ------------
--      1
--      2
--      3
-- ALL THREE products -- even though a real UPDATE would only have
-- touched rows belonging to ONE specific order.`,
    },
    {
      label: 'Confirming the trigger over-fires on an unrelated update',
      language: 'sql',
      code: `CREATE TABLE products (product_id INT, stock_qty INT);
INSERT INTO products VALUES (1, 100), (2, 100), (3, 5);  -- product 3 already understocked
CREATE TABLE low_stock_alerts (alert_id SERIAL, product_id INT, alert_type TEXT, triggered_at TIMESTAMPTZ);

-- The challenge's own trigger function and trigger, exactly as published,
-- attached to order_items.

-- Now UPDATE a row for order 100 (product 1 or 2) -- nothing to do
-- with product 3 at all:
UPDATE order_items SET qty = 6 WHERE item_id = 1;

SELECT * FROM low_stock_alerts;
--  product_id | alert_type | triggered_at
-- ------------+------------+---------------
--      3      | LOW_STOCK  | 2026-...
--
-- An UPDATE to order 100 (products 1 and 2) generated a low-stock
-- alert for PRODUCT 3, which the statement never touched -- exactly
-- because the tautological subquery re-scans the entire order_items
-- table on every single UPDATE, regardless of which rows changed.`,
    },
    {
      label: 'The fix — using PostgreSQL\'s transition tables',
      language: 'sql',
      code: `CREATE OR REPLACE FUNCTION fn_check_low_stock_fixed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
    SELECT DISTINCT nt.product_id, 'LOW_STOCK', now()
    FROM new_table nt   -- the actual transition table of changed rows
    JOIN products p ON p.product_id = nt.product_id
    WHERE (SELECT SUM(qty) FROM order_items WHERE product_id = nt.product_id) > p.stock_qty;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_check_low_stock_fixed
AFTER UPDATE ON order_items
REFERENCING NEW TABLE AS new_table   -- makes the changed rows available
FOR EACH STATEMENT EXECUTE FUNCTION fn_check_low_stock_fixed();

-- Now the trigger only evaluates products whose order_items rows were
-- ACTUALLY part of this UPDATE statement -- new_table contains exactly
-- those rows, closing the tautology entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team using the challenge\'s exact PostgreSQL trigger notices that low-stock alerts sometimes appear for products that clearly weren\'t touched by the update that supposedly triggered them, and the alert volume grows noticeably as the order_items table grows, even though update frequency stays constant. What single flaw in the trigger explains both symptoms?',
    hint: 'Trace exactly what the inner subquery SELECT DISTINCT order_id FROM order_items filters against — does it reference anything about the CURRENT statement at all?',
    solution: `Both symptoms trace back to the same flaw: the trigger's filtering
subquery — WHERE order_id IN (SELECT DISTINCT order_id FROM
order_items) — is a tautology that matches every row in the entire
table, not just the rows the triggering UPDATE actually changed. This
happens because the trigger is FOR EACH STATEMENT with no REFERENCING
transition table, so it has no way to see which specific rows changed
— and the subquery as written never attempts to narrow to them anyway.

This explains alerts for untouched products: the trigger re-evaluates
EVERY product in the table on every UPDATE, so any product that's
already over its stock threshold gets (re-)alerted regardless of what
the current statement modified. It also explains alert volume growing
with table size: the cost and scope of the check scale with the total
number of distinct products in order_items, not with the size of the
individual UPDATE. The fix is adding REFERENCING NEW TABLE AS
new_table to the trigger and querying that transition table instead
of re-scanning the whole order_items table via a self-referential,
unfiltered subquery.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the challenge\'s PostgreSQL trigger solution correctly restricts its low-stock check to only the products affected by the current UPDATE statement, since it filters by order_id.',
      reality: 'the filter is a tautology — WHERE order_id IN (SELECT DISTINCT order_id FROM order_items) matches every order_id in the ENTIRE table, since the inner subquery has no WHERE clause narrowing it to the current statement\'s changed rows.',
    },
    {
      thought: 'a STATEMENT-level trigger in PostgreSQL automatically has some way to know which rows the triggering statement changed, similar to how ROW-level triggers have NEW/OLD.',
      reality: 'a STATEMENT-level trigger only sees the changed rows if the CREATE TRIGGER explicitly declares REFERENCING NEW TABLE AS ... (or OLD TABLE) — without it, there is no way inside the trigger function to distinguish "rows this statement changed" from "all rows in the table."',
    },
    {
      thought: 'low-stock alerts appearing for products that clearly weren\'t part of a given UPDATE must indicate a bug somewhere in the application layer, not the trigger itself.',
      reality: 'this exact symptom is fully explained by the trigger\'s own tautological subquery re-evaluating every product in the table on every UPDATE — no application-layer bug is needed to produce it.',
    },
  ];
}
