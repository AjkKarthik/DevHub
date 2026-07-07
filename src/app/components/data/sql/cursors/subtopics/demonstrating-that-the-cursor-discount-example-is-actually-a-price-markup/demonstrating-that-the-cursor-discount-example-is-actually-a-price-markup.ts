import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cursor-discount-is-markup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-the-cursor-discount-example-is-actually-a-price-markup.html',
  styleUrl: './demonstrating-that-the-cursor-discount-example-is-actually-a-price-markup.scss',
})
export class DemonstratingThatTheCursorDiscountExampleIsActuallyAPriceMarkupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Same Word, Two Opposite Meanings, One Page',
      points: [
        'The main page has a challenge titled "Tiered discount function," whose entire point is percentage-based price REDUCTIONS: 0 orders → 0% off, 5–9 orders → 5% off, up to 25+ orders → 15% off — a get_discount_pct() that returns a percentage to SUBTRACT from a price.',
        'Separately, the "Cursor with UPDATE (MSSQL)" code tab has its own tiered logic, using a variable named @discount, with comments describing it as "Tiered logic per row." But tracing what the code actually does to the numbers shows the opposite operation: it multiplies the value by 1.05, 1.10, or 1.15 — an INCREASE of 5–15%, not a discount at all. The same word, "discount," describes a price cut in one part of the page and a price hike in another.',
      ],
    },
    {
      heading: 'Tracing Exactly What the Variable Holds',
      points: [
        'The variable is also misleadingly populated: the cursor\'s query is SELECT price FROM products ... — so @discount, despite its name, is FETCHed the row\'s actual PRICE, not a discount percentage at all. Every step of the tiered CASE expression is operating on and reassigning a price value into a variable named as if it held a discount rate.',
        'This subtopic runs the cursor logic on concrete numbers to show precisely what happens: a product priced at $8 becomes $9.20 (a 15% INCREASE, since $8 < 10 triggers the ×1.15 branch) — the literal opposite of what "discount" means, demonstrated with the exact branch logic and values the main page\'s own code produces.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own cursor code, run on concrete prices',
      language: 'sql',
      code: `CREATE TABLE products (product_id INT, category_id INT, price DECIMAL(10,2));
INSERT INTO products VALUES
    (1, 3, 8.00),    -- under $10
    (2, 3, 45.00),   -- between $10 and $100
    (3, 3, 250.00);  -- over $100

-- The main page's own "Cursor with UPDATE (MSSQL)" logic, applied:
DECLARE @discount DECIMAL(5,2);   -- name says "discount"...

DECLARE cur_prices CURSOR FOR
    SELECT price FROM products WHERE category_id = 3 FOR UPDATE OF price;

OPEN cur_prices;
FETCH NEXT FROM cur_prices INTO @discount;   -- ...but it's fetching PRICE

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @discount = CASE
        WHEN @discount < 10    THEN @discount * 1.15   -- x1.15, not a discount
        WHEN @discount < 100   THEN @discount * 1.10   -- x1.10, not a discount
        ELSE @discount * 1.05                          -- x1.05, not a discount
    END;
    UPDATE products SET price = @discount WHERE CURRENT OF cur_prices;
    FETCH NEXT FROM cur_prices INTO @discount;
END;
CLOSE cur_prices; DEALLOCATE cur_prices;

SELECT product_id, price FROM products ORDER BY product_id;
--  product_id | price
-- ------------+--------
--      1      |  9.20    -- $8.00 -> $9.20  (+15%, NOT a discount)
--      2      | 49.50    -- $45.00 -> $49.50 (+10%, NOT a discount)
--      3      | 262.50   -- $250.00 -> $262.50 (+5%, NOT a discount)`,
    },
    {
      label: 'Contrasting with the page\'s OWN, correctly-named discount function',
      language: 'sql',
      code: `-- The main page's challenge, elsewhere on the SAME page, correctly
-- implements an actual discount -- a percentage to SUBTRACT:
SELECT customer_id, get_discount_pct(customer_id) AS discount
FROM   customers
ORDER  BY customer_id;
--  customer_id | discount
-- -------------+----------
--      101     |  15.00    -- 15% OFF a purchase for a loyal customer
--
-- Applying THIS discount correctly reduces a price:
SELECT 100.00 * (1 - 15.00/100.0) AS discounted_price;
-- discounted_price = 85.00  -- price went DOWN, as "discount" implies

-- The cursor example's "@discount" variable does the mathematical
-- opposite: it INCREASES price. A reader skimming both examples on
-- the same topic page would reasonably assume "discount" means the
-- same operation in both places -- it does not.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A junior developer, having just read the main page\'s "Tiered discount function" challenge (where higher order counts mean bigger percentage discounts), skims the "Cursor with UPDATE" example afterward and assumes its @discount variable works the same way — reducing prices for some tier of products. Based on the traced values above, what will actually happen if they copy this cursor pattern expecting a discount, and what should the variable have been named?',
    hint: 'Trace the CASE expression\'s multipliers (1.15, 1.10, 1.05) against the literal meaning of "discount" — do these numbers reduce or increase a price?',
    solution: `If the developer copies this cursor pattern expecting a discount,
every affected product's price will INCREASE by 5-15% instead of
decreasing — the exact opposite of what they intended. As traced
above, an $8.00 product becomes $9.20 (a 15% price hike), not a
discounted $6.80 or similar. The CASE expression's multipliers
(×1.15, ×1.10, ×1.05) are markup factors, not discount factors —
a genuine discount would use factors like ×0.85, ×0.90, ×0.95
(or equivalently, price * (1 - pct/100)) to REDUCE the price.

The variable should have been named something like @markup or
@price_multiplier, and the surrounding comment ("Tiered logic per
row") should have specified that this is a tiered MARKUP, not a
discount — especially given that the SAME topic page has an entirely
separate, correctly-named "Tiered discount function" challenge doing
the mathematically opposite operation, creating exactly the kind of
copy-paste risk demonstrated here.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the @discount variable in the "Cursor with UPDATE (MSSQL)" example reduces product prices for some pricing tier, matching what "discount" normally means.',
      reality: 'the CASE expression multiplies price by 1.05, 1.10, or 1.15 — an INCREASE of 5-15%, the mathematical opposite of a discount — despite the variable being named @discount.',
    },
    {
      thought: 'since the main page uses the word "discount" consistently, it must mean the same operation (a price reduction) everywhere it appears on the page.',
      reality: 'the page uses "discount" for two functionally opposite operations in two different examples — the challenge\'s get_discount_pct() correctly reduces price, while the cursor example\'s @discount variable increases it, despite sharing the same terminology.',
    },
    {
      thought: 'a variable\'s name is a reliable guide to what value it holds and what operation is being performed on it.',
      reality: 'in this specific example, @discount is fetched directly from the price column and then multiplied UP, not down — the name actively misleads about both what the variable contains and what the surrounding logic does to it.',
    },
  ];
}
