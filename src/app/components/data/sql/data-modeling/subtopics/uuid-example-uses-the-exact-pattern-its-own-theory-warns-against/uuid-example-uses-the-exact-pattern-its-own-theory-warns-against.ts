import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-uuid-theory-contradiction-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './uuid-example-uses-the-exact-pattern-its-own-theory-warns-against.html',
  styleUrl: './uuid-example-uses-the-exact-pattern-its-own-theory-warns-against.scss',
})
export class UuidExampleUsesTheExactPatternItsOwnTheoryWarnsAgainstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Page\'s Own UUID Example Uses the Exact Pattern Its Own Theory Warns Against',
      points: [
        'The main page\'s own theory states clearly: "random UUIDs (NEWID() / gen_random_uuid()) fragment the clustered index badly (random inserts cause page splits). Use sequential UUIDs... if you must use UUID as a clustered PK." But the "Key strategies" code tab\'s PostgreSQL example does exactly the opposite: event_id UUID NOT NULL DEFAULT gen_random_uuid() — using gen_random_uuid() (a random v4 UUID) as the DEFAULT for a column that IS the clustered primary key, with only an inline comment ("v4; replace with uuidv7() on PG17") suggesting the fix rather than actually applying it.',
        'A reader who copies this code tab directly — which is the expected, primary way most readers will use a reference page\'s code examples — gets the EXACT anti-pattern the page\'s own theory section warns against just a few paragraphs earlier: random insert order into a UUID-keyed clustered index, causing the page splits and fragmentation the theory explicitly calls out as the reason to avoid this.',
      ],
    },
    {
      heading: 'What the Page\'s Own Theory Already Recommends Instead',
      points: [
        'On PostgreSQL 17+, the fix is a one-word swap: DEFAULT uuidv7() instead of DEFAULT gen_random_uuid() — a genuinely time-ordered UUID that inserts sequentially, just like an IDENTITY column. On earlier versions with no native uuidv7(), the page\'s own theory ALREADY describes the correct alternative: keep a sequential integer as the clustered primary key, and use the random UUID only as a secondary UNIQUE column for public-facing identifiers — the code tab simply never actually demonstrates this second, more broadly applicable pattern.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch — theory vs the page\'s own code',
      language: 'sql',
      code: `-- The main page's own THEORY:
-- "random UUIDs (NEWID() / gen_random_uuid()) fragment the clustered
--  index badly... use sequential UUIDs if you must use UUID as a
--  clustered PK, or use UUID as a secondary unique column and keep
--  an integer as the clustered PK."

-- The main page's own CODE TAB ("Key strategies"), PostgreSQL:
CREATE TABLE events_pg (
    event_id    UUID         NOT NULL DEFAULT gen_random_uuid(),  -- v4; replace with uuidv7() on PG17
    event_type  VARCHAR(50)  NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_events PRIMARY KEY (event_id)
);
-- event_id is BOTH the clustered PK AND a random (v4) UUID —
-- exactly the combination the theory says to avoid. Copying this
-- table verbatim reproduces the anti-pattern, not the recommendation.`,
    },
    {
      label: 'What the page\'s own theory actually recommends',
      language: 'sql',
      code: `-- PostgreSQL 17+: uuidv7() is genuinely time-ordered — no fragmentation
CREATE TABLE events_pg (
    event_id    UUID         NOT NULL DEFAULT uuidv7(),
    event_type  VARCHAR(50)  NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_events PRIMARY KEY (event_id)
);

-- Pre-PG17 (no native uuidv7()): keep an integer as the clustered PK
-- and use the random UUID only as a SECONDARY unique column — exactly
-- the "or use UUID as a secondary unique column" alternative the
-- page's own theory already describes:
CREATE TABLE events_pg_pre17 (
    event_seq   BIGINT       GENERATED ALWAYS AS IDENTITY,       -- clustered PK — sequential
    event_id    UUID         NOT NULL DEFAULT gen_random_uuid(), -- public-facing ID only
    event_type  VARCHAR(50)  NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_events_pre17    PRIMARY KEY (event_seq),
    CONSTRAINT uq_events_event_id UNIQUE (event_id)
);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team on PostgreSQL 15 (before uuidv7() exists) copies the main page\'s own events_pg table verbatim into production, planning to "upgrade later" per the inline comment. Six months later they are on PG17 and finally run an ALTER to switch the default to uuidv7(). Does changing just the DEFAULT clause fix the fragmentation problem for the table going forward?',
    hint: 'Think about what DEFAULT actually controls versus what is already sitting in the table from the six months of gen_random_uuid() inserts, and whether the clustered index\'s physical ordering can retroactively fix itself.',
    solution: `Changing the DEFAULT clause only affects NEW rows inserted from that
point forward — every row inserted during the six months on
gen_random_uuid() already has a RANDOMLY-ordered UUID as its physical
position in the clustered index, and that existing fragmentation does
not repair itself just because new inserts start arriving in
time-order. Going forward, new uuidv7()-based rows WILL insert in
order relative to EACH OTHER, but they'll be inserting into a clustered
index that's already fragmented from six months of random-order data
sitting throughout it.

Genuinely fixing this requires an index rebuild (or, more precisely for
a PostgreSQL clustered PK, a table reorganization via CLUSTER or a full
table rewrite) after switching the default, not just the DEFAULT change
alone. This is exactly why the page's own theory recommendation —
decide the RIGHT key strategy upfront, based on what's available NOW —
matters more than "start with the anti-pattern and fix it later": the
six months of technical debt doesn't erase itself the moment the
DEFAULT clause changes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own PostgreSQL "events_pg" example demonstrates the recommended sequential-UUID pattern its own theory section describes.',
      reality: 'the code tab\'s DEFAULT gen_random_uuid() generates a RANDOM (v4) UUID — the exact pattern the page\'s own theory warns fragments the clustered index — with only a comment suggesting the fix, not the fix itself.',
    },
    {
      thought: 'switching a UUID column\'s DEFAULT from gen_random_uuid() to uuidv7() retroactively fixes clustered-index fragmentation caused by the old random values.',
      reality: 'changing DEFAULT only affects future inserts — rows already written with random UUIDs remain physically scattered throughout the index, and a rebuild or reorganization is needed to actually repair the existing fragmentation.',
    },
    {
      thought: 'since PostgreSQL versions before 17 don\'t have uuidv7(), there\'s no way to avoid clustered-index fragmentation while still using UUIDs at all.',
      reality: 'the page\'s own theory already describes the alternative: keep a sequential integer as the clustered PK and use the random UUID only as a secondary UNIQUE column for public-facing identifiers — available on any PostgreSQL version, no uuidv7() required.',
    },
  ];
}
