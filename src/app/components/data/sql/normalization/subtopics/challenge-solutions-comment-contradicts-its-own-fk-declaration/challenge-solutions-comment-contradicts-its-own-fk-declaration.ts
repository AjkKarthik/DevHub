import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-challenge-fk-mismatch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './challenge-solutions-comment-contradicts-its-own-fk-declaration.html',
  styleUrl: './challenge-solutions-comment-contradicts-its-own-fk-declaration.scss',
})
export class ChallengeSolutionsCommentContradictsItsOwnFkDeclarationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge Solution\'s Own Closing Comment Contradicts Its Own FK Declaration',
      points: [
        'The main page\'s own "Normalize an Order Form Table" challenge solution declares order_lines.order_id as REFERENCES orders(order_id) with NO ON DELETE clause at all — which defaults to NO ACTION in both MSSQL and PostgreSQL (reject the parent delete if child rows exist). But the solution\'s own closing comment claims: "Remove an order → order_lines deleted via CASCADE; products table untouched." Running DELETE FROM orders WHERE order_id = 1 against this EXACT schema would not cascade at all — it would be REJECTED with a foreign key violation, since no CASCADE was ever declared.',
        'This is easy to miss because the comment reads as a natural, confident summary of "what this schema does" — appearing right after 20+ lines of correct DDL, in the same trusted context. A reader studying this challenge solution to learn the normalization concepts would have no reason to suspect the very last line is inaccurate about a detail unrelated to normalization itself.',
      ],
    },
    {
      heading: 'Two Ways to Resolve the Contradiction',
      points: [
        'Either the DDL should change to match the comment\'s stated intent (add ON DELETE CASCADE to the order_id FK, genuinely enabling the described behavior), or the comment should change to match the DDL as written (describing the actual NO ACTION / RESTRICT behavior: deleting an order with existing order_lines is rejected, and the caller must delete the order_lines first). Either fix is valid — what matters is that the code and the prose describing it agree, which they currently do not.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch, reproduced from the main page\'s own challenge solution',
      language: 'sql',
      code: `-- The main page's own challenge solution DDL:
CREATE TABLE order_lines (
    order_id   INT           NOT NULL REFERENCES orders(order_id),
    product_id INT           NOT NULL REFERENCES products(product_id),
    qty        INT           NOT NULL CHECK (qty > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    CONSTRAINT pk_order_lines PRIMARY KEY (order_id, product_id)
);
-- No ON DELETE clause at all → defaults to NO ACTION.

-- The solution's own closing comment, a few lines later:
-- "Remove an order → order_lines deleted via CASCADE; products table untouched"

-- Running exactly what the comment describes, against this EXACT schema:
DELETE FROM orders WHERE order_id = 1;
-- MSSQL:  "The DELETE statement conflicted with the REFERENCE constraint..."
-- PG:     "update or delete on table \\"orders\\" violates foreign key constraint..."
-- NOT a silent cascade — a rejected delete, identical to what NO ACTION
-- always does when child rows exist.`,
    },
    {
      label: 'Two valid fixes — pick the DDL or the comment',
      language: 'sql',
      code: `-- Fix 1: make the DDL match the comment's stated intent —
-- genuinely enable cascading delete of order_lines with their order:
ALTER TABLE order_lines DROP CONSTRAINT order_lines_order_id_fkey;
ALTER TABLE order_lines
    ADD CONSTRAINT order_lines_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE;
-- NOW "DELETE FROM orders WHERE order_id = 1" actually cascades,
-- matching the original comment.

-- Fix 2: leave the DDL as-is, correct the comment instead:
-- "Remove an order → BLOCKED while order_lines reference it (NO ACTION).
--  Delete order_lines for that order first, then the order itself."
-- This documents the ACTUAL behavior of the schema exactly as written,
-- with no DDL change required.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A student follows the main page\'s challenge solution exactly, then writes their own test asserting that deleting an order with existing order_lines succeeds and cascades. Using the schema exactly as declared in the solution, what does this test actually reveal, and which of the two fixes above would make the test pass without changing what it asserts?',
    hint: 'The test asserts CASCADE happens. Compare that assertion against what NO ACTION (the schema\'s actual, undeclared-CASCADE default) does when the delete is attempted.',
    solution: `The test would FAIL against the schema exactly as declared in the
solution — it asserts the DELETE succeeds and removes the order_lines
too, but the actual FK (with no ON DELETE clause, defaulting to
NO ACTION) rejects the DELETE outright with a foreign key violation
error. The test is correctly written to verify the BEHAVIOR the
solution's own comment describes — it just fails because the DDL never
actually implements that behavior.

Of the two fixes, only Fix 1 (adding ON DELETE CASCADE to the FK)
would make this specific test pass without changing what it asserts —
it makes the schema actually DO what the comment (and the student's
test, which trusted that comment) both describe. Fix 2 (correcting the
comment to describe NO ACTION instead) would require the student to
rewrite their test to assert a REJECTED delete instead, since it
resolves the contradiction by changing the documented behavior rather
than the schema's actual behavior.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own challenge solution\'s closing comment ("Remove an order → order_lines deleted via CASCADE") accurately describes what the DDL just above it actually does.',
      reality: 'the order_lines.order_id FK has no ON DELETE clause at all, defaulting to NO ACTION — deleting an order with existing order_lines is REJECTED with a foreign key violation, not silently cascaded, contradicting the comment.',
    },
    {
      thought: 'a reference page\'s challenge SOLUTION is authoritative and doesn\'t need the same scrutiny as a "common mistake" or "gotcha" example.',
      reality: 'a solution\'s closing summary comment is still prose written separately from the DDL — it can drift out of sync with the actual code just as easily as any other comment, and is worth verifying against the literal constraint declarations rather than trusted at face value.',
    },
    {
      thought: 'if a schema\'s FK declaration doesn\'t specify ON DELETE CASCADE explicitly, the delete behavior is undefined or inconsistent between MSSQL and PostgreSQL.',
      reality: 'both dialects default to the SAME behavior when ON DELETE is omitted — NO ACTION, rejecting the parent delete if child rows exist — it is well-defined and consistent, just not what the challenge solution\'s comment claims.',
    },
  ];
}
