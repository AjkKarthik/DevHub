import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cascade-delete-schema-mismatch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cascade-delete-demo-doesnt-match-the-pages-own-schema.html',
  styleUrl: './cascade-delete-demo-doesnt-match-the-pages-own-schema.scss',
})
export class CascadeDeleteDemoDoesntMatchThePagesOwnSchemaSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Page\'s Own Cascade Delete Demo Doesn\'t Match Its Own Schema',
      points: [
        'The main page\'s "T-SQL (MSSQL)" and "PostgreSQL" code tabs both define the Orders → Customers foreign key with ON DELETE NO ACTION (MSSQL) or ON DELETE RESTRICT (PostgreSQL) — explicitly NOT CASCADE. But the later "Integrity violations" tab demonstrates "Cascade delete: children auto-deleted with parent" using the EXACT SAME Customers/Orders tables, with a comment claiming "All Orders with CustomerID = 1 are also deleted silently." Running that DELETE against the schema actually defined earlier on this page would NOT cascade at all — it would instead hit the very next demo\'s "ON DELETE RESTRICT: parent delete blocked" error, since that IS the FK action the schema actually declares.',
        'This is easy to miss because the CASCADE demo is captioned as if it\'s a natural continuation of the same running example, when it actually silently assumes a DIFFERENT schema variant (one where the FK was declared ON DELETE CASCADE) that was never shown being created anywhere on this page.',
      ],
    },
    {
      heading: 'Why This Distinction Matters in Practice',
      points: [
        'A team copying this page\'s own T-SQL or PostgreSQL DDL verbatim, then later testing the "cascade delete" example against their OWN copy of the schema, would be genuinely confused when the DELETE fails with a constraint violation instead of silently cascading — the demo\'s comment describes behavior that requires a DIFFERENT FK declaration than what the page itself tells you to create. The fix for anyone wanting to actually see cascade behavior is to redeclare the FK with ON DELETE CASCADE explicitly, understanding the main page\'s own default schema deliberately does NOT do this — for exactly the safety reason the Q&A itself gives: cascades can ripple unexpectedly, so be cautious.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch — reproduced side by side',
      language: 'sql',
      code: `-- The main page's own MSSQL DDL (from the "T-SQL (MSSQL)" tab):
CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerID)
    REFERENCES Customers(CustomerID)
    ON DELETE NO ACTION    -- reject orphaning orders (explicit default)
    ON UPDATE CASCADE;

-- The main page's own PostgreSQL DDL (from the "PostgreSQL" tab):
CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
    REFERENCES customers(customer_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- NEITHER declares ON DELETE CASCADE — yet the page's own
-- "Integrity violations" tab later demonstrates:
DELETE FROM Customers WHERE CustomerID = 1;
-- Comment claims: "All Orders with CustomerID = 1 are also deleted silently"
-- Reality against THIS schema: blocked with a FK constraint violation,
-- identical to the very next demo on the same page.`,
    },
    {
      label: 'Actual behavior against the page\'s own schema, and the real fix',
      language: 'sql',
      code: `-- Running the page's own schema exactly as declared:
DELETE FROM Customers WHERE CustomerID = 1;
-- MSSQL: "The DELETE statement conflicted with the REFERENCE constraint..."
-- PG:    "update or delete on table \\"customers\\" violates foreign key constraint..."
-- This IS the ON DELETE RESTRICT / NO ACTION behavior — NOT a cascade.

-- To genuinely reproduce the page's own "cascade delete" demo, the FK
-- must be redeclared with ON DELETE CASCADE explicitly — it is NOT
-- what either of the page's own CREATE TABLE examples do by default:
ALTER TABLE Orders DROP CONSTRAINT FK_Orders_Customer;      -- MSSQL
ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Customer
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
    ON DELETE CASCADE;                                       -- now it will cascade

-- PostgreSQL equivalent:
ALTER TABLE orders DROP CONSTRAINT fk_orders_customer;
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    ON DELETE CASCADE;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A student runs the main page\'s MSSQL DDL exactly as written, then tries the "Cascade delete" demo from the Integrity Violations tab and gets a foreign key constraint error instead of the promised silent cascade. Using only what\'s declared on this page, explain exactly why, and identify the ONE line that would need to change to make the demo\'s comment true.',
    hint: 'Compare the FK\'s ON DELETE action in the CREATE TABLE statement against what the demo comment claims happens.',
    solution: `The demo's comment describes ON DELETE CASCADE behavior, but the
page's own CREATE TABLE statement for the Orders table declares
ON DELETE NO ACTION (MSSQL) — the exact opposite: reject the parent
delete if child rows exist. The demo isn't wrong about what ON DELETE
CASCADE would do in general — it's just describing a SCHEMA VARIANT
that was never actually created anywhere on this page.

The one line that would need to change is the FK's ON DELETE clause
itself: replacing "ON DELETE NO ACTION" with "ON DELETE CASCADE" in the
Orders table's FK_Orders_Customer constraint (or the equivalent
RESTRICT → CASCADE change in the PostgreSQL version) would make the
demo's comment accurate for that schema. Without that change, running
the "cascade delete" demo against the page's own DDL produces exactly
the SAME error as the very next demo block ("ON DELETE RESTRICT:
parent delete blocked") — because that IS the FK action actually in
effect.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "Cascade delete" demo shows what happens when you delete a Customer row using the exact schema declared earlier on the same page.',
      reality: 'the schema declared earlier (both the MSSQL and PostgreSQL versions) uses ON DELETE NO ACTION / RESTRICT, not CASCADE — the demo describes a DIFFERENT schema variant that was never actually created anywhere on this page.',
    },
    {
      thought: 'ON DELETE NO ACTION and ON DELETE RESTRICT mean the delete silently succeeds without cascading, just without deleting the children.',
      reality: 'both NO ACTION and RESTRICT mean the parent DELETE itself is REJECTED with an error when child rows exist — nothing is silently skipped, and nothing succeeds partially. The delete either fully happens (with CASCADE) or is fully blocked (with NO ACTION/RESTRICT).',
    },
    {
      thought: 'if a demo on a reference page shows a comment describing expected behavior, running the same commands against the same schema shown elsewhere on the page will always reproduce that behavior.',
      reality: 'always verify the CURRENT constraint declaration a demo assumes — a page can describe multiple possible configurations (default vs CASCADE) without every demo running against the literal DDL shown elsewhere on the same page.',
    },
  ];
}
