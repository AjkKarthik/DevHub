import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-adding-stored-column-lock-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './adding-a-stored-generated-column-locks-the-whole-table.html',
  styleUrl: './adding-a-stored-generated-column-locks-the-whole-table.scss',
})
export class AddingAStoredGeneratedColumnLocksTheWholeTableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A One-Liner With an Unstated Operational Cost',
      points: [
        'The main page\'s Q&A on JSON path expressions gives this example, presented as a simple, low-friction operation: "ALTER TABLE events ADD COLUMN event_type TEXT GENERATED ALWAYS AS (payload->>\'type\') STORED;" — described only as a way to "index a specific JSON field without a separate column update," with no mention of what this ALTER TABLE actually costs on a table that already has data.',
        'Adding a STORED generated column to an existing, populated table requires PostgreSQL to compute and write the generated value for EVERY existing row — this is a full table rewrite, and it takes an ACCESS EXCLUSIVE lock on the table for the ENTIRE duration, blocking all reads and writes, not just other DDL.',
      ],
    },
    {
      heading: 'Why This Differs From Adding an Ordinary Column',
      points: [
        'Adding an ordinary nullable column with no default (or one with certain "fast default" optimizations PostgreSQL applies) can often be a near-instant, metadata-only change in modern PostgreSQL versions — genuinely different from what this GENERATED ALWAYS AS ... STORED example does. A generated column has no such fast path: PostgreSQL must evaluate the generation expression against every existing row\'s payload column and physically store the result, which is inherently proportional to table size.',
        'This subtopic demonstrates the lock directly via pg_locks, exactly as the "Constraints" topic\'s NOT VALID subtopic did for CHECK constraints — confirming that, unlike NOT VALID + VALIDATE CONSTRAINT, there is no equivalent two-phase, non-blocking pattern for adding a STORED generated column in PostgreSQL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — a populated events table',
      language: 'sql',
      code: `CREATE TABLE events (id INT PRIMARY KEY, payload JSONB);
-- Populated with a large number of existing rows, e.g. millions,
-- each payload containing {"type": "click", ...} or similar.`,
    },
    {
      label: 'Confirming the ACCESS EXCLUSIVE lock via pg_locks',
      language: 'sql',
      code: `-- Session A: the exact ALTER TABLE from the main page's Q&A
BEGIN;
ALTER TABLE events
    ADD COLUMN event_type TEXT GENERATED ALWAYS AS (payload->>'type') STORED;
-- While this runs (rewriting every existing row):

-- Session B, run concurrently:
SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE relation = 'events'::regclass;

--  relation |          mode           | granted
-- ----------+--------------------------+---------
--  events   | AccessExclusiveLock     | t
--
-- AccessExclusiveLock blocks EVERY other operation on events --
-- SELECT, INSERT, UPDATE, DELETE, and other DDL all queue up behind
-- Session A until it commits, exactly as a plain (non-NOT VALID)
-- CHECK constraint addition would.`,
    },
    {
      label: 'Proving reads/writes actually block during the rewrite',
      language: 'sql',
      code: `-- Session B, attempted WHILE Session A's ALTER TABLE (above) is
-- still running on a large events table:
SELECT COUNT(*) FROM events;
-- Hangs -- blocked by Session A's AccessExclusiveLock, not returning
-- until Session A commits or rolls back.

INSERT INTO events (id, payload) VALUES (999999, '{"type": "test"}');
-- Also hangs, for the same reason.
--
-- Unlike a CHECK constraint, there is no NOT VALID equivalent for
-- adding a generated column -- PostgreSQL has no way to defer the
-- computation of a STORED generated column's initial values the way
-- it can defer a CHECK constraint's validation scan.`,
    },
    {
      label: 'A workaround for large tables — add nullable, backfill, then generate',
      language: 'sql',
      code: `-- There is no built-in "defer the rewrite" option, but a common
-- workaround avoids the single giant lock by doing the equivalent
-- work in smaller, separately-committed batches BEFORE converting
-- to a true generated column:

-- 1. Add a plain (non-generated) nullable column -- fast, metadata-only:
ALTER TABLE events ADD COLUMN event_type TEXT;

-- 2. Backfill in batches, each its own transaction (pseudocode loop):
--    UPDATE events SET event_type = payload->>'type'
--    WHERE event_type IS NULL AND id BETWEEN :start AND :end;
--    (repeated in ranges, each briefly taking a much smaller lock)

-- 3. Once fully backfilled, application code can rely on event_type
--    directly. A TRUE generated column can still be added later on a
--    NEW table via CREATE TABLE ... LIKE, if the generated-column
--    guarantee (always in sync, can't be manually set wrong) is
--    specifically required.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team plans to run the main page\'s exact ALTER TABLE events ADD COLUMN event_type TEXT GENERATED ALWAYS AS (payload->>\'type\') STORED; statement against a production events table with 800 million rows, during business hours, expecting it to be "just adding a column." What should they actually expect, and what alternative approach avoids the risk?',
    hint: 'Compare this ALTER TABLE to the CHECK constraint locking behavior from the Constraints topic — does a STORED generated column have an equivalent NOT VALID two-phase option?',
    solution: `They should expect a full table rewrite that takes an
AccessExclusiveLock on the entire events table for the whole duration
of that rewrite — on 800 million rows, this could mean the table is
completely unreadable and unwritable for a substantial period during
business hours, exactly the outcome a "just adding a column" mental
model doesn't anticipate. Unlike a CHECK constraint, there is no
NOT VALID + VALIDATE CONSTRAINT equivalent for a STORED generated
column — PostgreSQL has no built-in way to split this into a
fast, near-instant metadata change plus a separate, non-blocking
backfill.

The safer alternative is the batched-backfill workaround: add a
plain nullable TEXT column first (fast, metadata-only), backfill
event_type in small batches via separate, short transactions (each
taking a much smaller and shorter-lived lock), and rely on that
backfilled column directly rather than converting it into a true
GENERATED ALWAYS column, unless the specific guarantee a generated
column provides (impossible to set out of sync manually) is worth a
second, smaller-scale migration later.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS (...) STORED is a lightweight, metadata-only operation on PostgreSQL, similar to adding an ordinary nullable column.',
      reality: 'adding a STORED generated column to a populated table requires PostgreSQL to compute and write the generated value for every existing row — a full table rewrite under an AccessExclusiveLock, proportional to table size, not a metadata-only change.',
    },
    {
      thought: 'PostgreSQL provides a NOT VALID-style two-phase option for adding generated columns, the same way it does for CHECK constraints.',
      reality: 'there is no such option for generated columns — PostgreSQL has no built-in way to defer the computation of a STORED generated column\'s initial values across existing rows.',
    },
    {
      thought: 'the main page\'s JSON path generated-column example is safe to run as a single statement against any size table, since the Q&A frames it as simply "indexing a specific JSON field."',
      reality: 'the framing describes the QUERY benefit (an indexable column) without mentioning the OPERATIONAL cost of adding it — on a large, populated table, this single ALTER TABLE statement can cause significant application downtime.',
    },
  ];
}
