import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-ordertotal-trigger-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-ordertotal-trigger-actually-stays-in-sync.html',
  styleUrl: './testing-that-the-ordertotal-trigger-actually-stays-in-sync.scss',
})
export class TestingThatTheOrdertotalTriggerActuallyStaysInSyncSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Sync Trigger Is Never Proven to Work',
      points: [
        'The main page\'s own Denormalization tab ships a full trigger (trg_RecalcOrderTotal in MSSQL, recalc_order_total() in PostgreSQL) meant to keep Orders.OrderTotal in sync with SUM(OrderLines.Qty * OrderLines.UnitPrice) — but the page never actually proves the trigger works for all three operations it\'s declared for: AFTER INSERT, UPDATE, DELETE. A trigger this central to data correctness (the whole point of a documented denormalization is that the redundant copy MUST stay accurate) deserves a dedicated automated test proving each operation keeps OrderTotal correct — not just a read of the trigger\'s own source code.',
        'This matters especially for the DELETE case: the main page\'s own PostgreSQL trigger function reads COALESCE(NEW.order_id, OLD.order_id) — a detail easy to get subtly wrong (e.g. forgetting the OLD reference entirely, which would mean OrderTotal never recalculates when the LAST OrderLine of an order is removed, since NEW is NULL on a DELETE and there would be nothing left to fall back to).',
      ],
    },
    {
      heading: 'Why All Three Operations Need Their Own Test',
      points: [
        'INSERT and UPDATE both populate NEW, so a bug specific to the DELETE path (like a missing OLD reference) would pass both of those tests while silently breaking the one case that actually depends on it. Testing only the "happy path" of adding order lines would give false confidence that the entire trigger works, when only two of its three trigger conditions were ever actually exercised.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'tSQLt — INSERT, UPDATE, and DELETE all recalculate OrderTotal',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'OrderTotalTriggerTests';
GO

CREATE PROCEDURE OrderTotalTriggerTests.[test insert recalculates OrderTotal]
AS
BEGIN
    INSERT INTO Orders (OrderID, OrderTotal) VALUES (1, 0);
    INSERT INTO OrderLines (OrderID, ProductID, Qty, UnitPrice) VALUES (1, 100, 2, 9.99);

    EXEC tSQLt.AssertEquals 19.98, (SELECT OrderTotal FROM Orders WHERE OrderID = 1);
END;
GO

CREATE PROCEDURE OrderTotalTriggerTests.[test update recalculates OrderTotal]
AS
BEGIN
    INSERT INTO Orders (OrderID, OrderTotal) VALUES (1, 0);
    INSERT INTO OrderLines (OrderID, ProductID, Qty, UnitPrice) VALUES (1, 100, 2, 9.99);

    UPDATE OrderLines SET Qty = 5 WHERE OrderID = 1 AND ProductID = 100;

    EXEC tSQLt.AssertEquals 49.95, (SELECT OrderTotal FROM Orders WHERE OrderID = 1);
END;
GO

CREATE PROCEDURE OrderTotalTriggerTests.[test delete recalculates OrderTotal to zero]
AS
BEGIN
    INSERT INTO Orders (OrderID, OrderTotal) VALUES (1, 0);
    INSERT INTO OrderLines (OrderID, ProductID, Qty, UnitPrice) VALUES (1, 100, 2, 9.99);

    DELETE FROM OrderLines WHERE OrderID = 1 AND ProductID = 100;

    -- This is the case most likely to be missed if the trigger's DELETE
    -- handling has a bug.
    EXEC tSQLt.AssertEquals 0, (SELECT OrderTotal FROM Orders WHERE OrderID = 1);
END;
GO

EXEC tSQLt.Run 'OrderTotalTriggerTests';`,
    },
    {
      label: 'pgTAP — the same three cases, PostgreSQL',
      language: 'sql',
      code: `BEGIN;
SELECT plan(3);

INSERT INTO orders (order_id, order_total) VALUES (1, 0);
INSERT INTO order_lines (order_id, product_id, qty, unit_price) VALUES (1, 100, 2, 9.99);
SELECT is(
    (SELECT order_total FROM orders WHERE order_id = 1)::numeric,
    19.98::numeric,
    'INSERT recalculates order_total'
);

UPDATE order_lines SET qty = 5 WHERE order_id = 1 AND product_id = 100;
SELECT is(
    (SELECT order_total FROM orders WHERE order_id = 1)::numeric,
    49.95::numeric,
    'UPDATE recalculates order_total'
);

DELETE FROM order_lines WHERE order_id = 1 AND product_id = 100;
SELECT is(
    (SELECT order_total FROM orders WHERE order_id = 1)::numeric,
    0::numeric,
    'DELETE recalculates order_total back to zero'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "simplifies" the PostgreSQL trigger function by changing every <code>COALESCE(NEW.order_id, OLD.order_id)</code> reference to just <code>NEW.order_id</code>, reasoning that OLD is rarely needed. Using the three tests above, which one catches this, and why do the other two stay green?',
    hint: 'NEW is populated on INSERT and UPDATE, but what is NEW during a DELETE trigger — and what does the WHERE clause end up matching if it references NEW.order_id alone in that case?',
    solution: `The "delete recalculates OrderTotal to zero" test is the one that
catches this. On a DELETE, the NEW pseudo-row does not exist — NEW.order_id
is NULL. With the simplified (buggy) trigger referencing NEW.order_id
alone, the UPDATE's WHERE order_id = NULL clause matches NO ROWS AT ALL
(NULL never equals anything, including itself), so Orders.OrderTotal is
never touched. The test's assertion that OrderTotal drops back to 0
after the last OrderLine is deleted fails — OrderTotal stays stuck at
its previous value forever.

The INSERT and UPDATE tests both stay GREEN despite this bug, because
NEW.order_id IS populated for those two operations — the simplified
trigger still works correctly for them. This is exactly why testing
only the "add order lines" happy path gives false confidence: two out
of three tests would report success even after this exact regression
ships, and only the DELETE-specific test exposes that the trigger is
now silently broken for the one operation it needs OLD to handle.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test proving OrderTotal updates correctly when OrderLines are INSERTed is sufficient coverage for the main page\'s own sync trigger.',
      reality: 'INSERT and UPDATE both populate the NEW pseudo-row, but DELETE does not — a bug specific to handling OLD (needed only for DELETE) can pass every INSERT/UPDATE test while silently breaking the one operation that depends on it.',
    },
    {
      thought: 'COALESCE(NEW.order_id, OLD.order_id) in the main page\'s own trigger function is redundant defensive code, since NEW.order_id is "usually" populated.',
      reality: 'NEW is NULL by definition during a DELETE trigger — without falling back to OLD.order_id, the trigger\'s UPDATE statement matches zero rows on delete, and OrderTotal is never recalculated after the last OrderLine is removed.',
    },
    {
      thought: 'a denormalization sync trigger either obviously works or obviously doesn\'t — reading the trigger\'s source code is enough to verify its correctness.',
      reality: 'subtle bugs (like a missing OLD reference) only manifest for specific trigger conditions (DELETE) that are easy to skip when eyeballing code — an automated test exercising all three operations (INSERT, UPDATE, DELETE) catches what a code read alone can miss.',
    },
  ];
}
