import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-audit-trigger-merge-bug-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-audit-trigger-misclassifies-rows-during-a-merge-statement.html',
  styleUrl: './testing-that-the-audit-trigger-misclassifies-rows-during-a-merge-statement.scss',
})
export class TestingThatTheAuditTriggerMisclassifiesRowsDuringAMergeStatementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'How the Trigger Decides Insert vs. Update vs. Delete',
      points: [
        'The "Audit logging via triggers" code tab\'s MSSQL trigger fires AFTER INSERT, UPDATE, DELETE (a single combined trigger for all three) and computes the audited action with: CASE WHEN EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) THEN \'U\' WHEN EXISTS(SELECT 1 FROM inserted) THEN \'I\' ELSE \'D\' END.',
        'These EXISTS() checks test whether the inserted/deleted virtual tables contain ANY rows AT ALL for the whole statement — not whether a SPECIFIC row exists in both. For an ordinary single-type statement (a plain INSERT, a plain UPDATE, or a plain DELETE), that distinction never matters, since only one virtual table is ever populated (UPDATE populates both, but for the SAME set of changed rows).',
      ],
    },
    {
      heading: 'Where It Breaks: a Single MERGE Statement',
      points: [
        'A MERGE statement in SQL Server can perform INSERT, UPDATE, and DELETE actions against DIFFERENT rows within ONE statement execution — and fires the table\'s AFTER triggers exactly once per statement (not once per action type), with inserted/deleted populated with the UNION of all affected rows across every action the MERGE performed.',
        'If a single MERGE both inserts some new rows and deletes some other rows (with zero true updates), the trigger\'s table-wide EXISTS(inserted) AND EXISTS(deleted) both evaluate to TRUE — because inserted has genuinely new rows and deleted has genuinely removed rows, just NOT the same rows — so the CASE expression labels EVERY audited row as \'U\' (Update), even though none of them were actually updated.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the misclassification with a MERGE',
      language: 'sql',
      code: `-- (using the main page's exact orders_audit table and trg_orders_audit trigger)

-- A MERGE that inserts one new order and deletes one cancelled order --
-- zero rows are genuinely UPDATEd
MERGE INTO orders AS target
USING (VALUES (9001, 'Shipped')) AS src(order_id, status)
ON target.id = src.order_id
WHEN NOT MATCHED THEN
    INSERT (id, status) VALUES (src.order_id, src.status)
WHEN NOT MATCHED BY SOURCE AND target.status = 'Cancelled' THEN
    DELETE;
-- Say this inserts order 9001 (new) and deletes order 4200
-- (an old cancelled order no longer in the source) -- in ONE
-- statement, ZERO rows are truly "updated".

SELECT * FROM dbo.orders_audit ORDER BY audit_id DESC;
-- action | order_id
-- U      | 9001      <- WRONG: this was an INSERT, not an update
-- U      | 4200      <- WRONG: this was a DELETE, not an update
--
-- Both rows are mislabeled 'U' because EXISTS(inserted) is true
-- (order 9001 IS in inserted) AND EXISTS(deleted) is ALSO true
-- (order 4200 IS in deleted) -- for the STATEMENT as a whole, even
-- though neither individual row matches the other.`,
    },
    {
      label: 'The fix — classify per row via the FULL JOIN itself',
      language: 'sql',
      code: `CREATE OR ALTER TRIGGER trg_orders_audit
ON dbo.orders AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.orders_audit (action, order_id, old_status, new_status)
    SELECT
        CASE
            WHEN i.id IS NOT NULL AND d.id IS NOT NULL THEN 'U'  -- row present on both sides
            WHEN i.id IS NOT NULL THEN 'I'                        -- only in inserted
            ELSE 'D'                                              -- only in deleted
        END,
        COALESCE(i.id, d.id),
        d.status,
        i.status
    FROM inserted i FULL JOIN deleted d ON i.id = d.id;
END;

-- Re-running the same MERGE now produces:
-- action | order_id
-- I      | 9001      -- correct: was an insert
-- D      | 4200      -- correct: was a delete
--
-- The CASE now evaluates i.id/d.id PER ROW of the FULL JOIN result,
-- instead of checking table-wide existence across the whole
-- statement.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A nightly ETL job uses a single MERGE statement to both insert newly-arrived orders and delete orders that no longer exist in the source system, in one execution. A compliance review later finds the orders_audit table shows only \'U\' (Update) rows for that night — zero \'I\' or \'D\' rows anywhere. Is the ETL job actually only performing updates?',
    hint: 'Check what EXISTS(SELECT 1 FROM inserted) and EXISTS(SELECT 1 FROM deleted) each test — table-wide presence, or a specific row\'s presence in both.',
    solution: `No — the ETL job genuinely performs inserts and deletes (that's its
documented purpose), but the audit trigger's table-wide EXISTS()
checks cannot tell them apart from updates when a single MERGE
statement produces BOTH inserted and deleted rows in the same
execution. Since inserted is non-empty (the new orders) AND deleted
is non-empty (the removed orders), the trigger's CASE expression
concludes the whole statement was an "update" and labels every
audited row 'U', regardless of which rows were actually inserted or
deleted.

The fix replaces the table-wide EXISTS() checks with a per-row
classification based on the FULL JOIN between inserted and deleted:
a row present in both is a genuine update; a row present only in
inserted is an insert; a row present only in deleted is a delete —
exactly matching what the FULL JOIN already computes for the audit
INSERT's other columns.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a combined AFTER INSERT, UPDATE, DELETE trigger that checks EXISTS(SELECT 1 FROM inserted) and EXISTS(SELECT 1 FROM deleted) correctly identifies which DML operation caused the trigger to fire.',
      reality: 'those checks only tell you whether the inserted/deleted virtual tables are non-empty for the WHOLE statement — for statement types that populate both tables with genuinely different rows (like a MERGE performing separate inserts and deletes), the checks cannot distinguish "this row was updated" from "different rows were separately inserted and deleted."',
    },
    {
      thought: 'ordinary plain INSERT, UPDATE, and DELETE statements are the only ones that fire an AFTER trigger, so trigger logic only needs to handle those three cases.',
      reality: 'a single MERGE statement can trigger AFTER triggers with inserted and deleted populated by any combination of its INSERT/UPDATE/DELETE actions in one firing — trigger logic written assuming only one action type per firing can misclassify MERGE-driven changes.',
    },
    {
      thought: 'if an audit table consistently shows the wrong action label for MERGE-driven changes, the MERGE statement itself must be misconfigured.',
      reality: 'here the MERGE statement is working exactly as intended — the bug is entirely in the trigger\'s table-wide (rather than per-row) classification logic.',
    },
  ];
}
