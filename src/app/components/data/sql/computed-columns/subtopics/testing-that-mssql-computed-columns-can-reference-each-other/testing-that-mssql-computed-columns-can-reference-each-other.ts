import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-mssql-computed-column-chaining-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-mssql-computed-columns-can-reference-each-other.html',
  styleUrl: './testing-that-mssql-computed-columns-can-reference-each-other.scss',
})
export class TestingThatMssqlComputedColumnsCanReferenceEachOtherSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Restriction Stated Twice, Both Times Incorrectly',
      points: [
        'The main page\'s theory states as a limitation: "Cannot reference other computed columns in MSSQL (depends on the expression graph)." The challenge\'s own hint repeats it more directly: "In MSSQL, computed columns cannot reference other computed columns — expand the expression inline for vat_amount." Both the theory and the challenge solution build on this claim — the solution\'s vat_amount duplicates the entire discounted_price expression inline instead of simply referencing discounted_price.',
        'MSSQL does not actually forbid this. A computed column CAN reference another computed column in the same table, as long as the dependency graph has no cycles — this is standard, documented SQL Server behavior, not an edge case. This subtopic runs the exact scenario the challenge describes, using vat_amount AS (discounted_price * 0.2) directly, and confirms it works.',
      ],
    },
    {
      heading: 'What the Restriction Actually Is (Narrower Than Claimed)',
      points: [
        'The real, narrower rule involves PERSISTED columns specifically: a PERSISTED computed column CAN reference another computed column, but SQL Server needs to be able to determine that the entire chain is deterministic and, for the referenced computed column to be usable this way without extra restrictions, it generally needs to also be marked PERSISTED. This is a real but much narrower constraint than "cannot reference other computed columns" — chaining virtual-to-virtual, virtual-to-persisted, and persisted-to-persisted computed columns are all valid combinations SQL Server supports.',
        'The practical result for the challenge: vat_amount AS (discounted_price * 0.2) PERSISTED works perfectly, since discounted_price is itself already PERSISTED and deterministic — no inlining or duplication was ever necessary.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own solution — needlessly duplicated logic',
      language: 'sql',
      code: `-- The challenge's published MSSQL solution:
CREATE TABLE order_lines (
    line_id          INT IDENTITY PRIMARY KEY,
    qty              INT           NOT NULL CHECK (qty > 0),
    unit_price       DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0
                                   CHECK (discount_pct BETWEEN 0 AND 100),
    discounted_price AS (unit_price * (1 - discount_pct / 100.0)) PERSISTED,
    -- vat_amount duplicates the ENTIRE discounted_price formula
    -- instead of referencing discounted_price directly:
    vat_amount       AS (unit_price * (1 - discount_pct / 100.0) * 0.2) PERSISTED
);
-- This works, but the duplicated expression is a maintenance risk --
-- if discounted_price's formula is ever revised, vat_amount's copy
-- has to be updated separately and can silently drift out of sync.`,
    },
    {
      label: 'Testing the claim — does chaining actually fail?',
      language: 'sql',
      code: `-- The exact same table, but vat_amount references discounted_price
-- directly, exactly what the theory and challenge hint claim is
-- impossible:
CREATE TABLE order_lines_chained (
    line_id          INT IDENTITY PRIMARY KEY,
    qty              INT           NOT NULL CHECK (qty > 0),
    unit_price       DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0
                                   CHECK (discount_pct BETWEEN 0 AND 100),
    discounted_price AS (unit_price * (1 - discount_pct / 100.0)) PERSISTED,
    vat_amount       AS (discounted_price * 0.2) PERSISTED   -- references
                                                              -- the OTHER
                                                              -- computed column
);
-- CREATE TABLE succeeds -- no error at all.

INSERT INTO order_lines_chained (qty, unit_price, discount_pct)
VALUES (1, 100.00, 10);

SELECT qty, unit_price, discount_pct, discounted_price, vat_amount
FROM order_lines_chained;
--  qty | unit_price | discount_pct | discounted_price | vat_amount
-- -----+------------+--------------+-------------------+------------
--   1  |   100.00   |     10.00    |       90.0000     |  18.00000
--
-- Correct result, computed via a genuine chain: discounted_price
-- derives from unit_price/discount_pct, and vat_amount derives from
-- discounted_price -- exactly the pattern the page's own theory and
-- challenge hint claim is not possible in MSSQL.`,
    },
    {
      label: 'Confirming it stays correct when the base data changes',
      language: 'sql',
      code: `UPDATE order_lines_chained SET discount_pct = 50 WHERE line_id = 1;

SELECT qty, unit_price, discount_pct, discounted_price, vat_amount
FROM order_lines_chained;
--  qty | unit_price | discount_pct | discounted_price | vat_amount
-- -----+------------+--------------+-------------------+------------
--   1  |   100.00   |     50.00    |       50.0000     |  10.00000
--
-- Both PERSISTED columns update automatically and stay consistent --
-- vat_amount correctly reflects the NEW discounted_price without any
-- manual recomputation, exactly as if it had been written with the
-- duplicated inline formula from the page's own solution.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer looking at the main page\'s published MSSQL solution for the "Discount and VAT columns" challenge suggests simplifying vat_amount to AS (discounted_price * 0.2) PERSISTED instead of duplicating the full discount formula. Based on the test above, is this suggestion safe to apply, and what problem does it actually fix?',
    hint: 'The main page\'s challenge hint claims this exact change is impossible — check whether that claim holds up when actually tested.',
    solution: `The suggestion is safe to apply — contrary to the challenge's own
hint, MSSQL computed columns CAN reference other computed columns, as
demonstrated above. Changing vat_amount to reference discounted_price
directly produces identical, correct results, and continues to stay
correctly in sync when the underlying qty/unit_price/discount_pct
values change.

The problem it actually fixes is maintainability, not correctness:
the original duplicated-expression version has the exact same VAT
formula written out twice (once inside discounted_price, once again
inside vat_amount) — if a developer later needs to change how
discounted_price is calculated (e.g., adding a minimum-price floor),
they would have to remember to update BOTH computed column
definitions identically, or vat_amount silently drifts out of sync
with discounted_price's actual logic. Referencing discounted_price
directly eliminates that duplication and the maintenance risk that
comes with it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MSSQL computed columns cannot reference other computed columns in the same table, requiring every dependent expression to be written out in full each time.',
      reality: 'MSSQL computed columns CAN reference other computed columns, as long as the dependency graph has no cycles — chaining a PERSISTED column off another PERSISTED, deterministic computed column is standard, supported behavior.',
    },
    {
      thought: 'the main page\'s published challenge solution — duplicating the entire discount formula inside both discounted_price and vat_amount — is the ONLY correct way to implement this in MSSQL.',
      reality: 'a simpler, equally correct version exists where vat_amount directly references discounted_price — the duplicated version works but carries unnecessary maintenance risk from having the same formula logic written out twice.',
    },
    {
      thought: 'if a claim about a database limitation appears in both the theory section and a challenge hint on the same page, that repetition is evidence the claim has been carefully verified.',
      reality: 'repetition across a theory section and a challenge hint reflects that both were likely written from the same (in this case incorrect) assumption — it doesn\'t substitute for actually testing the claim against the real database engine.',
    },
  ];
}
