import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-out-of-order-sequence-commits-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-committed-sequence-ids-can-appear-out-of-order.html',
  styleUrl: './testing-that-committed-sequence-ids-can-appear-out-of-order.scss',
})
export class TestingThatCommittedSequenceIdsCanAppearOutOfOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Claim That Sounds Theoretical Until You Reproduce It',
      points: [
        'The main page\'s Q&A states: "multi-threaded applications reserve values in parallel and write them in a different order — so committed IDs appear out of sequence." This is stated as fact but never demonstrated with an actual pair of concurrent sessions — it\'s easy to read past as an edge case that "probably doesn\'t matter much" for most applications.',
        'It matters specifically for any code that assumes "higher ID = created later" — a common assumption used for cursor-based pagination, incremental data sync ("give me everything with id > last_seen_id"), or simple ordering by primary key instead of an explicit timestamp. This subtopic reproduces the exact scenario: two sessions racing to insert, where the session that gets the LOWER id commits SECOND.',
      ],
    },
    {
      heading: 'Why the Reordering Happens',
      points: [
        'nextval() (or IDENTITY generation) allocates a value immediately and atomically, completely independent of when — or whether — that transaction eventually commits. Two concurrent transactions can call nextval() in one order (A gets 100, B gets 101) but take wildly different amounts of time to do their remaining work before COMMIT — if B finishes and commits first, id 101 becomes visible to other readers before id 100 does.',
        'A reader polling "SELECT * FROM orders WHERE id > 100 ORDER BY id" between those two commits would see row 101 but miss row 100 entirely at that moment — and even after row 100 later commits, a naive "greater than last max id seen" sync cursor may have already advanced past it, permanently skipping that row.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'sql',
      code: `CREATE TABLE orders (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, customer TEXT);`,
    },
    {
      label: 'Session A — gets the lower ID but takes longer to commit',
      language: 'sql',
      code: `-- Session A:
BEGIN;
INSERT INTO orders (customer) VALUES ('Alice') RETURNING id;
-- Returns id = 100

-- Simulate extra work before committing (e.g. a slow downstream
-- API call, a large batch insert in the same transaction, etc.)
-- Session A does NOT commit yet -- it's still "in flight."`,
    },
    {
      label: 'Session B — gets the higher ID and commits immediately',
      language: 'sql',
      code: `-- Session B, started AFTER Session A but finishes faster:
BEGIN;
INSERT INTO orders (customer) VALUES ('Bob') RETURNING id;
-- Returns id = 101

COMMIT;   -- Session B commits FIRST, while Session A is still open.

-- A reader running concurrently, right now:
SELECT id, customer FROM orders ORDER BY id;
--  id  | customer
-- -----+----------
--  101 | Bob
-- Only id 101 is visible -- id 100 (Alice) is still hidden inside
-- Session A's uncommitted transaction, even though it was allocated
-- FIRST.

-- Session A now finally commits:
-- COMMIT;
-- Only NOW does id 100 become visible -- arriving in the visible
-- result set AFTER id 101 already did, despite being the lower ID.`,
    },
    {
      label: 'Why a naive incremental sync cursor misses row 100',
      language: 'sql',
      code: `-- A sync process that ran "SELECT * FROM orders WHERE id > 0" at the
-- moment right after Session B's commit (but before Session A's)
-- would see id=101 and record "last_seen_id = 101" as its new cursor.
--
-- When Session A's id=100 row finally commits and becomes visible,
-- the sync process's NEXT poll runs "SELECT * FROM orders WHERE id
-- > 101" -- which permanently skips id=100, since 100 is not > 101.
--
-- The fix: use a strictly increasing, COMMIT-ordered marker instead
-- of the identity/sequence value itself for incremental sync --
-- e.g. a "processed_at" timestamp set by a trigger at commit-visible
-- time, or query with a safety overlap window (id > last_seen_id -
-- N) to re-check recently-committed rows that may have arrived
-- out of order.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data warehouse sync job runs every 5 minutes with the query "SELECT * FROM orders WHERE id > :last_max_id" and updates :last_max_id to the highest id seen each run. After a period of heavy concurrent order creation, a customer reports their order is completely missing from the warehouse, even though it exists in the source database. Based on the scenario demonstrated above, what\'s the most likely cause?',
    hint: 'The missing order\'s id was probably allocated to a transaction that took slightly longer to commit than a concurrent transaction with a HIGHER id.',
    solution: `The most likely cause is exactly the out-of-order commit scenario
demonstrated above: the missing order's transaction was allocated a
LOWER id but took slightly longer to commit than a concurrent
transaction that got a HIGHER id and committed first. The sync job's
poll happened to run in the narrow window after the higher-id
transaction committed but before the lower-id one did -- it saw the
higher id, advanced its "last_max_id" cursor past it, and then
permanently skipped the lower-id row once it finally committed,
since the next poll's WHERE id > :last_max_id excludes it.

The fix is to stop using the identity/sequence value itself as the
incremental sync cursor, since it reflects ALLOCATION order, not
COMMIT (visibility) order. Reliable alternatives: sync using a
"created_at" or "synced_at" timestamp set by a trigger AFTER commit
visibility is guaranteed, or add a deliberate overlap window to each
poll (re-checking the last few id values below the previous cursor)
to catch any rows that committed slightly out of order.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a row with a lower sequence-generated ID was always inserted (and became visible to other sessions) before a row with a higher ID, since IDs are allocated in increasing order.',
      reality: 'ID ALLOCATION order and COMMIT (visibility) order are two different things — under concurrency, a transaction with a higher allocated ID can commit and become visible before a concurrent transaction with a lower allocated ID, since sequence allocation happens independently of when a transaction eventually commits.',
    },
    {
      thought: '"multi-threaded applications... write them in a different order" (the main page\'s own wording) describes a rare, theoretical edge case unlikely to affect a typical application.',
      reality: 'it reliably reproduces with just two ordinary concurrent transactions and a small timing difference in how long each takes before COMMIT — no unusual load or exotic configuration is needed, as shown directly above.',
    },
    {
      thought: 'an incremental sync process using "WHERE id > last_max_id_seen" is a safe, standard pattern as long as the id column is a monotonically increasing sequence or identity.',
      reality: 'this exact pattern is vulnerable to permanently skipping rows whose transactions commit slightly later than a concurrent transaction with a higher id — a timestamp-based cursor or an overlap window is needed for correctness under concurrent writes.',
    },
  ];
}
