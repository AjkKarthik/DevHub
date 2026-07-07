import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-postgresql-enum-harder-to-evolve-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-postgresql-enum-alternative-is-harder-to-evolve-not-easier.html',
  styleUrl: './the-postgresql-enum-alternative-is-harder-to-evolve-not-easier.scss',
})
export class ThePostgresqlEnumAlternativeIsHarderToEvolveNotEasierSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Presented as a Drop-In Alternative, With No Caveat',
      points: [
        'The main page\'s own "PostgreSQL schema design" code tab shows CHECK (status IN (\'pending\',\'shipped\',\'completed\',\'cancelled\')), then immediately below it: "Or use a PostgreSQL native ENUM type" — with a CREATE TYPE ... AS ENUM statement, presented as if it were an equivalent, simply more "native," alternative. No caveat is given about the tradeoff between the two.',
        'CHECK constraints can be altered freely at any time with an ordinary, transactional DDL operation: ALTER TABLE orders DROP CONSTRAINT chk_orders_status; ALTER TABLE orders ADD CONSTRAINT chk_orders_status CHECK (status IN (...new list...)); — no special restriction, runs inside any transaction alongside other statements.',
      ],
    },
    {
      heading: 'ENUM Has a Documented Restriction the Page Never Mentions',
      points: [
        'PostgreSQL ENUM types have a well-documented limitation: a newly added enum value (ALTER TYPE order_status ADD VALUE \'refunded\') cannot be used in the SAME transaction that added it — even though ADD VALUE itself became fully transactional as of PostgreSQL 12 (before that, it could not even run inside a transaction block alongside other DDL/DML at all). Any application deploy or migration script that adds a new status value AND immediately tries to use it in the same transaction will fail.',
        'This makes ENUM types genuinely HARDER to evolve than the CHECK constraint they\'re offered as an alternative to — exactly backwards from what a reader might assume from "native type = better." Practical guidance: prefer CHECK for genuinely evolving status lists (most real "order status" style columns change over a product\'s lifetime); reserve ENUM for truly fixed, rarely-changing small vocabularies where its smaller on-disk representation is worth the migration friction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CHECK constraint — trivially evolvable',
      language: 'sql',
      code: `-- Adding a new status value to a CHECK-constrained column: one
-- ordinary, transactional DDL statement pair, no restrictions:
BEGIN;
  ALTER TABLE orders DROP CONSTRAINT chk_orders_status;
  ALTER TABLE orders ADD CONSTRAINT chk_orders_status
      CHECK (status IN ('pending','shipped','completed','cancelled','refunded'));

  -- Can immediately use the new value in the SAME transaction:
  UPDATE orders SET status = 'refunded' WHERE order_id = 42;
COMMIT;
-- Works without any special handling.`,
    },
    {
      label: 'ENUM — the same-transaction restriction, reproduced',
      language: 'sql',
      code: `-- The main page's own ENUM alternative:
CREATE TYPE order_status AS ENUM ('pending','shipped','completed','cancelled');
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;

-- Adding a new value AND using it in the same transaction:
BEGIN;
  ALTER TYPE order_status ADD VALUE 'refunded';

  UPDATE orders SET status = 'refunded' WHERE order_id = 42;
COMMIT;
-- ERROR:  unsafe use of new value "refunded" of enum type order_status
-- HINT:   New enum values must be committed before they can be used.

-- The fix requires SPLITTING this into two separate transactions:
BEGIN;
  ALTER TYPE order_status ADD VALUE 'refunded';
COMMIT;

BEGIN;
  UPDATE orders SET status = 'refunded' WHERE order_id = 42;
COMMIT;
-- Now it works -- but this two-deploy-step requirement is exactly
-- the migration friction the CHECK constraint alternative doesn't have.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own ENUM recommendation for an order_status column. Six months later, product wants to add a "refunded" status, and a developer writes a single migration script that adds the enum value and immediately updates existing orders to use it, expecting it to work like any other schema change. The deploy fails. Using the mechanics above, explain why, and what the developer needs to change about how the migration is deployed.',
    hint: 'Check whether the ADD VALUE statement and the UPDATE that uses the new value are running in the same transaction — and what PostgreSQL specifically disallows about that combination.',
    solution: `The deploy fails because ALTER TYPE order_status ADD VALUE 'refunded'
and the subsequent UPDATE orders SET status = 'refunded' ... are both
running inside the same transaction. PostgreSQL explicitly disallows
using a newly added enum value within the same transaction that added
it -- this restriction exists even in PostgreSQL 12+, where ADD VALUE
itself became transactional (in earlier versions, ADD VALUE couldn't
even run in a transaction block with other statements at all).

The fix is to split the migration into two separate deploy steps: a
first migration that runs ALTER TYPE ... ADD VALUE 'refunded' alone
and commits, followed by a second migration (a later deploy, or at
minimum a separate transaction) that performs the UPDATE using the new
value. This two-step requirement is exactly the kind of migration
friction the main page's CHECK constraint alternative doesn't have --
a CHECK constraint's new allowed value can be added and used in the
very same transaction with no restriction.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own "Or use a PostgreSQL native ENUM type" comment implies ENUM is simply a more idiomatic, equally flexible alternative to a CHECK constraint for status-style columns.',
      reality: 'ENUM types have a documented restriction — a newly added value cannot be used in the same transaction that added it — making them genuinely harder to evolve than a CHECK constraint, which can be altered and immediately used within a single transaction.',
    },
    {
      thought: 'since PostgreSQL 12 made ALTER TYPE ... ADD VALUE fully transactional, adding and using a new enum value works the same way as any other schema change.',
      reality: 'PostgreSQL 12 only made the ADD VALUE statement itself safe to run inside a transaction block alongside other statements — it did NOT remove the restriction that the new value cannot be USED within that same transaction. The value must be committed first.',
    },
    {
      thought: 'a native database type (like ENUM) is inherently a better long-term choice than a constraint-based approach (like CHECK), since it\'s a more "proper" way to model a fixed set of values.',
      reality: 'for value sets that genuinely change over a product\'s lifetime — which is the common case for status-style columns — a CHECK constraint\'s unrestricted evolvability makes it the more practical choice; ENUM is better reserved for truly fixed, rarely-changing vocabularies.',
    },
  ];
}
