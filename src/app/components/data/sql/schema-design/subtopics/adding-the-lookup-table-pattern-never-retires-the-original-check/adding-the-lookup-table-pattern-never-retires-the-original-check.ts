import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-lookup-table-never-retires-check-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './adding-the-lookup-table-pattern-never-retires-the-original-check.html',
  styleUrl: './adding-the-lookup-table-pattern-never-retires-the-original-check.scss',
})
export class AddingTheLookupTablePatternNeverRetiresTheOriginalCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Tabs, One Column, Two Enforcement Mechanisms',
      points: [
        'The main page\'s own "Table DDL" tab defines Orders with CONSTRAINT CHK_Orders_Status CHECK (Status IN (\'Pending\',\'Shipped\',\'Completed\',\'Cancelled\')). Its own "Junction & lookup tables" tab, later on the same page, recommends a lookup-table alternative for the IDENTICAL column — with the comment "Prefer over CHECK (status IN (...)) for large/changeable value sets" — and adds CONSTRAINT FK_Orders_Status FOREIGN KEY (Status) REFERENCES OrderStatuses (StatusCode) to the SAME Orders.Status column. It never shows dropping the original CHECK constraint first.',
        'A reader following both tabs in sequence to build one real schema ends up with Orders.Status governed by TWO independent enforcement mechanisms simultaneously: the original hardcoded CHECK list, and the new FK to OrderStatuses. Any value written to Status must now satisfy BOTH constraints at once.',
      ],
    },
    {
      heading: 'This Defeats the Entire Stated Purpose of Switching to a Lookup Table',
      points: [
        'A genuinely valid new status added to OrderStatuses — say, \'Refunded\' — would still be REJECTED by the old CHECK constraint, since the CHECK\'s literal list was never updated or removed. The whole point of adopting a lookup table ("changeable value sets," per the page\'s own comment) is defeated: the CHECK constraint remains the actual bottleneck, silently blocking any status the lookup table was specifically added to make easy to introduce.',
        'The fix is straightforward but must not be skipped: ALTER TABLE Orders DROP CONSTRAINT CHK_Orders_Status; needs to run BEFORE (or as part of) adding the FK-to-lookup-table pattern, retiring the old enforcement mechanism entirely so the lookup table becomes the SOLE source of truth for valid status values.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the conflict — following both tabs in sequence',
      language: 'sql',
      code: `-- Step 1: build Orders exactly per the main page's "Table DDL" tab:
CREATE TABLE Orders (
    OrderID    BIGINT        NOT NULL IDENTITY(1,1),
    CustomerID INT           NOT NULL,
    Status     VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    CONSTRAINT PK_Orders        PRIMARY KEY (OrderID),
    CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending','Shipped','Completed','Cancelled'))
);

-- Step 2: apply the main page's own "Junction & lookup tables" tab,
-- verbatim, to the SAME Orders table:
CREATE TABLE OrderStatuses (
    StatusCode  VARCHAR(20)   NOT NULL,
    Description NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_OrderStatuses PRIMARY KEY (StatusCode)
);
INSERT INTO OrderStatuses (StatusCode, Description) VALUES
    ('Pending', 'Order placed'), ('Shipped', 'In transit'),
    ('Completed', 'Delivered'), ('Cancelled', 'Cancelled'),
    ('Refunded', 'Refund issued');   -- the whole point: a NEW status

ALTER TABLE Orders ADD
    CONSTRAINT FK_Orders_Status FOREIGN KEY (Status) REFERENCES OrderStatuses (StatusCode);

-- Attempt to use the new, genuinely valid status:
UPDATE Orders SET Status = 'Refunded' WHERE OrderID = 1;
-- Msg 547: The UPDATE statement conflicted with the CHECK constraint
-- "CHK_Orders_Status". -- REJECTED, despite 'Refunded' being a
-- perfectly valid row in OrderStatuses. The old CHECK constraint,
-- never removed, is still silently enforcing the ORIGINAL list.`,
    },
    {
      label: 'The fix — retire the CHECK constraint before relying on the lookup table',
      language: 'sql',
      code: `-- Drop the original CHECK constraint FIRST:
ALTER TABLE Orders DROP CONSTRAINT CHK_Orders_Status;

-- The FK to OrderStatuses is now the SOLE enforcement mechanism:
UPDATE Orders SET Status = 'Refunded' WHERE OrderID = 1;
-- Succeeds -- 'Refunded' is a valid row in OrderStatuses, and there
-- is no longer a competing CHECK constraint to reject it.

-- Going forward, adding a new status is a single, simple INSERT --
-- exactly the "changeable value set" benefit the lookup table pattern
-- was meant to provide in the first place:
INSERT INTO OrderStatuses (StatusCode, Description) VALUES ('OnHold', 'Payment pending review');
UPDATE Orders SET Status = 'OnHold' WHERE OrderID = 2;   -- works immediately`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer follows the main page\'s own lookup-table pattern to make Orders.Status more flexible, adds a new \'Refunded\' row to OrderStatuses, and is confused when <code>UPDATE Orders SET Status = \'Refunded\'</code> fails with a CHECK constraint violation — the error doesn\'t even mention the OrderStatuses table or the new FK at all. What\'s actually happening, and why does the error message point somewhere unexpected?',
    hint: 'Check whether the ORIGINAL CHECK constraint from the "Table DDL" tab is still attached to the Status column after adding the FK — the FK addition doesn\'t automatically remove anything.',
    solution: `The original CHECK constraint (CHK_Orders_Status) from the main page's
"Table DDL" tab was never dropped — adding the new FK constraint from
the "Junction & lookup tables" tab doesn't automatically remove or
replace it. Both constraints are now active simultaneously on the same
Status column, and SQL Server enforces ALL constraints on a column,
not just the newest one. The error message names CHK_Orders_Status
specifically because THAT is the constraint that actually rejected the
value -- the FK constraint would have allowed 'Refunded' just fine,
since it IS present in OrderStatuses, but the value never gets that
far because the older CHECK constraint blocks it first.

The fix is ALTER TABLE Orders DROP CONSTRAINT CHK_Orders_Status; --
retiring the original enforcement mechanism so the FK-to-lookup-table
becomes the sole source of truth for valid status values, which is
what the "Junction & lookup tables" tab's own comment ("Prefer over
CHECK... for large/changeable value sets") was recommending all along.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding a new FK constraint to a column, following the main page\'s own lookup-table recommendation, automatically supersedes or replaces any existing CHECK constraint on that same column.',
      reality: 'FK and CHECK constraints on the same column are independent and additive — SQL Server enforces every constraint present, regardless of when it was added. Adding a new constraint never automatically retires an older one.',
    },
    {
      thought: 'if two of a reference page\'s own code tabs both describe valid, individually-correct patterns for the same column, applying both together is safe.',
      reality: 'each tab may be individually correct in isolation but leave out a step (like dropping a prior constraint) that\'s only necessary when the patterns are COMBINED — verifying the combination, not just each piece separately, is what catches this.',
    },
    {
      thought: 'a CHECK constraint violation error naming a specific constraint always means that constraint\'s logic is what the developer intended to enforce.',
      reality: 'the named constraint may simply be a leftover from an earlier design that was supposed to be retired — the error message correctly identifies WHICH constraint blocked the value, but not WHETHER that constraint should still exist at all.',
    },
  ];
}
