import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-first-value-vs-last-value-frame-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-first-values-explicit-frame-is-a-no-op-but-last-values-is-essential.html',
  styleUrl: './why-first-values-explicit-frame-is-a-no-op-but-last-values-is-essential.scss',
})
export class WhyFirstValuesExplicitFrameIsANoOpButLastValuesIsEssentialSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Same-Looking Frame Clause Means Something Different for Each Function',
      points: [
        'The main page\'s own FIRST_VALUE example explicitly specifies ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — but this is EXACTLY the default frame that already applies automatically whenever ORDER BY appears in OVER(), per the main page\'s own theory ("The default frame with ORDER BY is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW"). Writing it out changes nothing: FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate) returns the identical result without that explicit frame clause at all.',
        'LAST_VALUE, in the very same code tab right below it, needs the OPPOSITE treatment. Because the DEFAULT frame ends at CURRENT ROW, LAST_VALUE under the default frame returns the CURRENT row\'s own value — a lookup that changes on every row — rather than the true last value in the partition. Only by explicitly OVERRIDING the default frame, extending it to UNBOUNDED FOLLOWING, does LAST_VALUE return the actual final value.',
      ],
    },
    {
      heading: 'Why the Two Functions Diverge Despite Looking Symmetric',
      points: [
        'FIRST_VALUE\'s natural definition — "the earliest value up to and including the current row, in ORDER BY order" — happens to COINCIDE exactly with what the default frame already provides. There is nothing to fix, because the default frame was already correct for this function\'s purpose.',
        'LAST_VALUE\'s natural definition — "the value at the end of the partition" — requires seeing rows AFTER the current one, which the default frame explicitly excludes (it stops at CURRENT ROW). This is why the SAME syntax pattern — an explicit ROWS BETWEEN clause — is redundant for one function and essential for the other, even though the two functions look perfectly symmetric at a glance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'FIRST_VALUE — the explicit frame changes nothing',
      language: 'sql',
      code: `-- With the main page's own explicit frame:
SELECT CustomerID, OrderDate,
    FIRST_VALUE(OrderDate) OVER (
        PARTITION BY CustomerID ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS FirstOrderDate_Explicit
FROM Orders;

-- Without ANY frame clause -- relies on the implicit default:
SELECT CustomerID, OrderDate,
    FIRST_VALUE(OrderDate) OVER (
        PARTITION BY CustomerID ORDER BY OrderDate
        -- no ROWS BETWEEN clause at all
    ) AS FirstOrderDate_Implicit
FROM Orders;

-- Both columns return IDENTICAL values for every row -- the explicit
-- frame in the main page's own example is a no-op, since it exactly
-- restates the default frame that already applies.`,
    },
    {
      label: 'LAST_VALUE — the explicit frame is the entire fix',
      language: 'sql',
      code: `-- Without an explicit frame -- the same "no-op-looking" omission that
-- was harmless for FIRST_VALUE is actively WRONG here:
SELECT ProductID, OrderDate, UnitPrice,
    LAST_VALUE(UnitPrice) OVER (
        PARTITION BY ProductID ORDER BY OrderDate
        -- missing frame -- default frame stops at CURRENT ROW
    ) AS WrongLastPrice
FROM OrderDetails;
-- Result: WrongLastPrice equals THIS ROW's own UnitPrice on every row
-- -- not the actual last price in the partition. Every row shows a
-- DIFFERENT "last price," which is never what LAST_VALUE is meant to mean.

-- With the frame explicitly extended past the current row:
SELECT ProductID, OrderDate, UnitPrice,
    LAST_VALUE(UnitPrice) OVER (
        PARTITION BY ProductID ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS CorrectLastPrice
FROM OrderDetails;
-- Result: CorrectLastPrice is the SAME value (the true final price)
-- on every row within a given ProductID partition -- correct.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate, having seen both FIRST_VALUE and LAST_VALUE written with the identical-looking explicit <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> frame in some older code, "cleans up" the query by removing this "redundant" frame clause from BOTH functions, assuming it was decorative in both cases. What breaks, and why did it only break for one of the two functions?',
    hint: 'Check what the frame clause the teammate removed actually WAS in each case — was it the default frame, or an override of the default frame?',
    solution: `Removing the frame clause from FIRST_VALUE breaks nothing -- that
clause (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) was already
the implicit default whenever ORDER BY is present, so omitting it
changes nothing about the result.

Removing the frame clause from LAST_VALUE, however, is a different
situation entirely if the ORIGINAL correct code had specified ROWS
BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (the override
needed to see the true last row) -- removing THAT specific clause
reverts LAST_VALUE back to the default frame (ending at CURRENT ROW),
silently breaking it back into the "WrongLastPrice" behavior: each row
now returns its own UnitPrice instead of the actual last price in the
partition. The two functions only look symmetric in the code; the
frame clause each one needs is fundamentally different, and "cleaning
up" both the same way applies the wrong assumption to LAST_VALUE.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FIRST_VALUE and LAST_VALUE are mirror images of each other, so whatever frame syntax is correct for one is automatically correct (or safely removable) for the other.',
      reality: 'the two functions have different natural definitions relative to the default frame — FIRST_VALUE\'s natural meaning already matches the default frame, while LAST_VALUE\'s natural meaning requires explicitly overriding it. The same-looking syntax plays a completely different role for each.',
    },
    {
      thought: 'an explicit ROWS BETWEEN clause on a window function is always either necessary for correctness or purely stylistic — it can\'t be "correct but redundant" in one case and "the entire fix" in another within the same query.',
      reality: 'the main page\'s own FIRST_VALUE and LAST_VALUE examples, sitting in the very same code tab, demonstrate exactly this: an identical-looking frame clause is a harmless no-op for FIRST_VALUE and the essential correctness fix for LAST_VALUE.',
    },
    {
      thought: 'if a window function query with LAST_VALUE returns a plausible-looking value for every row, the frame is probably set up correctly.',
      reality: 'the "WrongLastPrice" result under the default frame is entirely plausible-looking on its own — it is a real value (the current row\'s own price) that just happens not to be the value LAST_VALUE was intended to represent; nothing about the output signals an error.',
    },
  ];
}
