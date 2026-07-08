import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-on-conflict-noop-without-constraint-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-on-conflict-do-nothing-is-a-no-op-without-a-constraint.html',
  styleUrl: './testing-that-on-conflict-do-nothing-is-a-no-op-without-a-constraint.scss',
})
export class TestingThatOnConflictDoNothingIsANoOpWithoutAConstraintSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Duplicate-Prevention Clause That Prevents Nothing',
      points: [
        'The challenge explicitly requires: "Use NOT EXISTS or LEFT JOIN to avoid duplicate alerts for the same product." The published PostgreSQL solution instead ends its INSERT with ON CONFLICT DO NOTHING — a genuine PostgreSQL upsert clause, but one that only has any effect when the target table has a UNIQUE or EXCLUSION constraint for it to detect a conflict against.',
        'The challenge\'s own schema comment defines low_stock_alerts as (alert_id, product_id, alert_type, triggered_at) — with no UNIQUE constraint mentioned anywhere on product_id, or on any combination of columns. Without one, ON CONFLICT DO NOTHING has nothing to ever conflict WITH — every INSERT succeeds unconditionally, and the clause is a syntactically valid no-op.',
      ],
    },
    {
      heading: 'Why This Passes Unnoticed',
      points: [
        'ON CONFLICT DO NOTHING without a specific conflict target (a column list or ON CONSTRAINT name) is valid PostgreSQL syntax regardless of whether any constraint exists — it doesn\'t raise an error at CREATE or INSERT time for missing a target. It just silently does nothing extra, behaving identically to a plain INSERT with no ON CONFLICT clause at all.',
        'This makes the bug invisible under casual testing: the trigger "works" (inserts alerts correctly) in every single test, since nothing about a missing constraint produces an error or a warning — the ONLY way to notice the duplicate-prevention isn\'t happening is to specifically test for duplicates across multiple qualifying UPDATE statements, which the challenge itself never demonstrates.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming low_stock_alerts has no unique constraint',
      language: 'sql',
      code: `CREATE TABLE low_stock_alerts (
    alert_id     SERIAL PRIMARY KEY,   -- unique on alert_id only
    product_id   INT,
    alert_type   TEXT,
    triggered_at TIMESTAMPTZ
);
-- No UNIQUE or EXCLUSION constraint on product_id, alert_type, or
-- any combination -- exactly matching the challenge's own schema
-- comment: "low_stock_alerts(alert_id, product_id, alert_type,
-- triggered_at)" with no constraint mentioned.

SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'low_stock_alerts'::regclass;
--  conname                    | contype
-- ----------------------------+----------
--  low_stock_alerts_pkey      |    p       -- only the PK, on alert_id
-- No 'u' (unique) or 'x' (exclusion) constraint exists at all.`,
    },
    {
      label: 'Demonstrating ON CONFLICT DO NOTHING inserts duplicates anyway',
      language: 'sql',
      code: `-- The challenge's own INSERT pattern, run twice for the same product:
INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
VALUES (3, 'LOW_STOCK', now())
ON CONFLICT DO NOTHING;

INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
VALUES (3, 'LOW_STOCK', now())
ON CONFLICT DO NOTHING;

SELECT COUNT(*) FROM low_stock_alerts WHERE product_id = 3;
-- 2  -- BOTH inserts succeeded. ON CONFLICT DO NOTHING had zero
-- effect, because there is no unique constraint on product_id (or
-- any column combination) for a "conflict" to even be possible --
-- every INSERT is unconditionally a "new" row from Postgres's
-- perspective, since alert_id (the only unique column) is different
-- each time via the SERIAL default.`,
    },
    {
      label: 'The fix the challenge\'s own hint actually asked for',
      language: 'sql',
      code: `-- Option 1: add the missing unique constraint, so ON CONFLICT has
-- something real to detect (requires deciding what "duplicate" means
-- -- e.g. one alert per product per hour):
ALTER TABLE low_stock_alerts
    ADD COLUMN alert_window TIMESTAMPTZ GENERATED ALWAYS AS (date_trunc('hour', triggered_at)) STORED;
ALTER TABLE low_stock_alerts
    ADD CONSTRAINT uq_alerts_product_window UNIQUE (product_id, alert_window);

INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
VALUES (3, 'LOW_STOCK', now())
ON CONFLICT (product_id, alert_window) DO NOTHING;
-- NOW ON CONFLICT actually has a real constraint to check against.

-- Option 2: the challenge's OWN stated hint -- NOT EXISTS, no schema
-- change required:
INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
SELECT 3, 'LOW_STOCK', now()
WHERE NOT EXISTS (
    SELECT 1 FROM low_stock_alerts a
    WHERE a.product_id = 3
      AND a.triggered_at >= now() - INTERVAL '1 hour'
);
-- This correctly prevents the duplicate without needing ANY new
-- constraint -- exactly what the challenge asked for, and what the
-- published MSSQL solution (using NOT EXISTS) actually does.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer approves the challenge\'s PostgreSQL solution because "it has ON CONFLICT DO NOTHING, so duplicate alerts are handled." A teammate runs the exact test from the second code tab above (two qualifying inserts for the same product) and gets 2 rows, not 1. Was the reviewer\'s reasoning sound, and what was missing from their review?',
    hint: 'ON CONFLICT DO NOTHING being present in the SQL text is not the same as it having an actual effect — check what it needs to exist elsewhere in the schema to do anything at all.',
    solution: `The reviewer's reasoning was not sound — they checked for the
PRESENCE of ON CONFLICT DO NOTHING in the code, but never verified
that a unique or exclusion constraint actually exists on
low_stock_alerts for it to detect a conflict against. Without one,
the clause is syntactically valid but functionally inert: every
INSERT succeeds, since there's never anything for Postgres to
consider a "conflict."

What was missing from the review was exactly the test the teammate
ran: inserting two qualifying rows and checking whether a duplicate
was actually prevented. Reading the SQL text alone can't reveal this
bug, since ON CONFLICT DO NOTHING never raises an error or warning
for lacking a backing constraint — the only way to catch it is to
run the actual scenario the code is supposed to prevent (duplicate
alerts) and confirm the row count matches expectations, exactly as
the challenge's own hint (NOT EXISTS or LEFT JOIN) would have
guaranteed without needing this verification step at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'INSERT ... ON CONFLICT DO NOTHING always prevents duplicate rows, since that\'s its documented purpose as PostgreSQL\'s upsert-adjacent syntax.',
      reality: 'ON CONFLICT DO NOTHING only has an effect if the target table has a UNIQUE or EXCLUSION constraint for it to detect a conflict against — without one, it is syntactically valid but functionally a complete no-op.',
    },
    {
      thought: 'if a table has a PRIMARY KEY, ON CONFLICT DO NOTHING will use it to prevent duplicate inserts on any columns, including ones that aren\'t part of the primary key.',
      reality: 'a PRIMARY KEY only makes the PK column(s) themselves unique — here, alert_id (a SERIAL) is different on every insert, so the PK never conflicts, no matter how many times the same product_id is inserted.',
    },
    {
      thought: 'a duplicate-prevention bug like this would be caught by any reasonable code review, since the missing constraint is an obvious gap.',
      reality: 'the bug is genuinely easy to miss in review — the ON CONFLICT DO NOTHING clause reads as correct, complete duplicate-prevention code, and nothing about running it once (the typical smoke test) reveals that the underlying constraint it depends on doesn\'t exist.',
    },
  ];
}
