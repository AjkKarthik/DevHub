import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-usp-placeorder-oversell-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-usp-placeorder-can-oversell-stock-under-concurrent-calls.html',
  styleUrl: './testing-that-usp-placeorder-can-oversell-stock-under-concurrent-calls.scss',
})
export class TestingThatUspPlaceorderCanOversellStockUnderConcurrentCallsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Check-Then-Act Pattern Split Across Two Statements',
      points: [
        'The main page\'s own flagship usp_PlaceOrder procedure checks IF (SELECT Stock FROM Products WHERE ProductID = @ProductID) < @Quantity THROW ..., then SEPARATELY runs UPDATE Products SET Stock = Stock - @Quantity — two independent statements, not one atomic check-and-decrement. Under the default READ COMMITTED isolation, with no locking hint on the initial SELECT, two concurrent calls for the SAME ProductID can both pass the stock check against the same starting value, then both proceed to decrement.',
        'The self-referencing UPDATE statement itself is individually safe from LOSING an update — each decrement correctly applies against whatever the row\'s current value is at UPDATE time (the same mechanic established for the Transactions topic\'s own bank-transfer example). But that safety only guarantees the two decrements are both APPLIED — it does nothing to stop their COMBINED effect from taking stock negative, since neither transaction re-validates the check after the other has already decremented.',
      ],
    },
    {
      heading: 'The Page\'s Own PostgreSQL Version Already Shows the Fix',
      points: [
        'The main page\'s own PL/pgSQL place_order function, covering the identical business scenario, uses SELECT stock INTO v_stock FROM products WHERE product_id = p_product_id FOR UPDATE — locking the row at read time, exactly closing the race the MSSQL version leaves open. The fix template already exists elsewhere on the same page; usp_PlaceOrder just doesn\'t use the MSSQL equivalent (WITH (UPDLOCK)).',
        'A cleaner MSSQL fix collapses the check and the decrement into a single atomic statement: UPDATE Products SET Stock = Stock - @Quantity WHERE ProductID = @ProductID AND Stock >= @Quantity, then check @@ROWCOUNT = 0 to detect and reject an oversell — no separate read step to race against at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the oversell — two concurrent calls, the main page\'s own procedure',
      language: 'sql',
      code: `-- Starting stock: 10 units
UPDATE Products SET Stock = 10 WHERE ProductID = 7;

-- Session 1                                -- Session 2
BEGIN TRANSACTION;                          BEGIN TRANSACTION;
IF (SELECT Stock FROM Products
    WHERE ProductID = 7) < 8                IF (SELECT Stock FROM Products
    THROW 50001, 'Insufficient stock', 1;       WHERE ProductID = 7) < 8
-- Sees Stock = 10, 10 >= 8, PASSES              THROW 50001, 'Insufficient stock', 1;
                                             -- ALSO sees Stock = 10 (READ COMMITTED,
                                             -- no lock held from Session 1's SELECT),
                                             -- ALSO PASSES
UPDATE Products SET Stock = Stock - 8
WHERE ProductID = 7;
COMMIT TRANSACTION;   -- Stock now 2
                                             UPDATE Products SET Stock = Stock - 8
                                             WHERE ProductID = 7;
                                             -- Blocks briefly on the row lock, then
                                             -- applies against the POST-Session-1
                                             -- value: 2 - 8 = -6
                                             COMMIT TRANSACTION;

SELECT Stock FROM Products WHERE ProductID = 7;
-- Returns -6 -- both orders "succeeded," both callers received a
-- valid @OrderID, and the warehouse has been oversold by 6 units,
-- with no error raised anywhere.`,
    },
    {
      label: 'The fix — collapse the check and decrement into one atomic statement',
      language: 'sql',
      code: `CREATE OR ALTER PROCEDURE usp_PlaceOrder_Safe
    @CustomerID INT,
    @ProductID  INT,
    @Quantity   INT,
    @OrderID    BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO Orders (CustomerID, OrderDate)
        VALUES (@CustomerID, SYSUTCDATETIME());
        SET @OrderID = SCOPE_IDENTITY();

        -- Check AND decrement in ONE atomic statement -- no separate
        -- read to race against:
        UPDATE Products
        SET Stock = Stock - @Quantity
        WHERE ProductID = @ProductID
          AND Stock >= @Quantity;      -- the check IS the WHERE clause

        IF @@ROWCOUNT = 0
            THROW 50001, 'Insufficient stock', 1;   -- catches BOTH "no such product" and "not enough stock"

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

-- Re-running the same two-session scenario: Session 2's UPDATE now
-- matches ZERO rows (Stock is 2, condition requires Stock >= 8), so
-- @@ROWCOUNT = 0 correctly triggers the "Insufficient stock" error --
-- the oversell is impossible by construction.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A warehouse team reports that a specific high-demand product occasionally shows negative stock in the database, but only during flash-sale traffic spikes — never during normal load or in manual QA testing. Using the mechanics demonstrated above, explain why this bug is traffic-dependent, and confirm whether the fix in the second code tab would eliminate it entirely.',
    hint: 'Think about what has to happen, specifically, for two concurrent EXEC calls to both read the SAME stock value before either one writes — and how traffic volume affects the odds of that happening.',
    solution: `The bug requires two (or more) concurrent calls to usp_PlaceOrder for
the SAME product to both execute their stock-check SELECT before
EITHER of their UPDATE statements commits -- a narrow timing window
that only opens up meaningfully under high concurrent load. During
normal traffic or single-session manual QA, calls are effectively
serialized in practice (one finishes well before the next starts), so
the race almost never manifests -- exactly matching the "only during
flash-sale spikes" pattern.

The fix in the second code tab eliminates this entirely, regardless of
traffic volume: by folding the stock check into the UPDATE's WHERE
clause (Stock >= @Quantity), the check and the decrement become a
SINGLE atomic operation. There is no longer a separate read step for
a concurrent transaction to race against -- each UPDATE either
succeeds (stock was sufficient at that exact moment) or matches zero
rows (@@ROWCOUNT = 0, correctly rejected), with no window for two
transactions to both pass a check against the same stale value.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because a single self-referencing UPDATE statement (like UPDATE Products SET Stock = Stock - @Quantity) is safe from lost updates, the whole usp_PlaceOrder procedure is safe from concurrency bugs involving Stock.',
      reality: 'the self-referencing UPDATE is safe from LOSING an update — both concurrent decrements are correctly applied. But the SEPARATE stock-check SELECT that runs before it can pass based on stale data, allowing the combined effect of two valid-looking decrements to oversell stock, which is a different failure mode than a lost update.',
    },
    {
      thought: 'a bug that only appears under high concurrent load, and never during normal testing, is likely an infrastructure or scaling issue rather than a logic bug in the stored procedure itself.',
      reality: 'a check-then-act race condition is a logic bug that specifically requires concurrent execution to manifest — its absence during low-traffic testing is expected, not evidence that the procedure is correct.',
    },
    {
      thought: 'the main page\'s own PL/pgSQL place_order function and its MSSQL usp_PlaceOrder procedure handle the identical "place order, check stock, decrement" scenario the same way, since they\'re presented as equivalent examples.',
      reality: 'the PL/pgSQL version uses FOR UPDATE to lock the row during the stock check, closing the race — the MSSQL version has no equivalent locking hint, making it genuinely vulnerable to the oversell race the PostgreSQL version already avoids.',
    },
  ];
}
