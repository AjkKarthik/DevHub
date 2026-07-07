import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-concurrent-merge-holdlock-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './concurrent-merge-statements-can-still-race-without-holdlock.html',
  styleUrl: './concurrent-merge-statements-can-still-race-without-holdlock.scss',
})
export class ConcurrentMergeStatementsCanStillRaceWithoutHoldlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Opening Claim, Revisited',
      points: [
        'The main page opens with: "Database-native upsert handles this atomically — no race condition, no extra round-trip." That statement is true for PostgreSQL\'s ON CONFLICT, but it overstates what plain MSSQL MERGE guarantees under the default READ COMMITTED isolation level.',
        'MERGE is atomic in the sense that its own INSERT/UPDATE/DELETE actions all commit or roll back together as one statement. But "atomic" does not mean "serialized against other concurrent MERGE statements." Under READ COMMITTED, two sessions can both evaluate the same WHEN NOT MATCHED condition as true for the same key at the same time — before either has inserted — and both then attempt the INSERT, producing exactly the duplicate-key race the opening claim says upsert avoids.',
      ],
    },
    {
      heading: 'The Fix: WITH (HOLDLOCK) on the Target',
      points: [
        'Microsoft\'s own documentation for MERGE recommends adding the HOLDLOCK table hint on the target table specifically to close this race: MERGE target WITH (HOLDLOCK) USING source .... HOLDLOCK holds a range lock through the end of the statement, preventing a second concurrent MERGE from evaluating the same key until the first one has committed its decision.',
        'Without HOLDLOCK, the "no race condition" property the main page advertises only holds when upserts are serialized some other way (e.g. an application-level queue, or a single writer) — it is not a guarantee MERGE provides by default the way PostgreSQL\'s ON CONFLICT does.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — a MERGE without HOLDLOCK',
      language: 'sql',
      code: `CREATE TABLE user_preferences (
    user_id INT PRIMARY KEY,
    theme   VARCHAR(20),
    lang    VARCHAR(10)
);
-- Empty table -- both sessions below are upserting the SAME new user_id.`,
    },
    {
      label: 'Two sessions racing the same key (default isolation)',
      language: 'sql',
      code: `-- Session A and Session B run this near-simultaneously,
-- both for user_id = 42, under READ COMMITTED (the default):

MERGE user_preferences AS target
USING (VALUES (42, 'dark', 'en')) AS source (user_id, theme, lang)
    ON target.user_id = source.user_id
WHEN MATCHED THEN
    UPDATE SET theme = source.theme, lang = source.lang
WHEN NOT MATCHED THEN
    INSERT (user_id, theme, lang) VALUES (source.user_id, source.theme, source.lang);

-- Without HOLDLOCK, both sessions can read the target as "no row for
-- user_id = 42 yet" before either has inserted -- both then try
-- WHEN NOT MATCHED THEN INSERT, and the second one fails with:
--
-- Violation of PRIMARY KEY constraint 'PK_user_preferences'.
-- Cannot insert duplicate key in object 'dbo.user_preferences'.
--
-- This is the exact race condition the main page's opening theory
-- claims database-native upsert avoids -- it does NOT avoid it here.`,
    },
    {
      label: 'The fix — WITH (HOLDLOCK) closes the race',
      language: 'sql',
      code: `MERGE user_preferences WITH (HOLDLOCK) AS target
USING (VALUES (42, 'dark', 'en')) AS source (user_id, theme, lang)
    ON target.user_id = source.user_id
WHEN MATCHED THEN
    UPDATE SET theme = source.theme, lang = source.lang
WHEN NOT MATCHED THEN
    INSERT (user_id, theme, lang) VALUES (source.user_id, source.theme, source.lang);

-- With HOLDLOCK, the second concurrent session blocks until the first
-- session's MERGE commits, then re-evaluates and correctly takes the
-- WHEN MATCHED branch instead of racing into WHEN NOT MATCHED.
-- No duplicate-key error, no manual retry loop needed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says "I switched our upsert job from a manual SELECT-then-INSERT-or-UPDATE pattern to MERGE specifically because the docs said upsert avoids race conditions — but I\'m still seeing occasional primary-key violations in production." What is the most likely single-line fix, and why did switching to plain MERGE not already solve the problem?',
    hint: 'MERGE\'s atomicity guarantees apply to its own three branches committing together — it says nothing by default about serializing against a SECOND concurrent MERGE statement.',
    solution: `The most likely fix is adding the HOLDLOCK table hint on the target:
change "MERGE user_preferences AS target" to
"MERGE user_preferences WITH (HOLDLOCK) AS target".

Switching from manual SELECT-then-INSERT-or-UPDATE to MERGE did
remove the ORIGINAL two-round-trip race condition (SELECT sees "not
exists," then a separate INSERT collides). But MERGE alone, under the
default READ COMMITTED isolation level, only guarantees that its own
WHEN MATCHED / WHEN NOT MATCHED branches apply atomically as ONE
statement -- it does not by default lock the target row range against
a SECOND, independently-running MERGE statement hitting the same key
at nearly the same instant. Two concurrent MERGE statements can both
observe "no matching row yet" and both attempt INSERT, producing the
exact primary-key violation the teammate is still seeing.

HOLDLOCK closes this specific gap by holding a range lock on the
target through the end of the MERGE statement, so a second concurrent
MERGE for the same key blocks until the first commits, then correctly
re-evaluates as WHEN MATCHED instead of racing into WHEN NOT MATCHED.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'switching from manual SELECT-then-INSERT-or-UPDATE to MERGE completely eliminates race conditions, because MERGE is described as "atomic."',
      reality: 'MERGE\'s atomicity only covers its own WHEN MATCHED/NOT MATCHED branches committing together as one statement -- under the default READ COMMITTED isolation, two concurrent MERGE statements targeting the same key can still both take the INSERT branch and collide, unless the target is locked with WITH (HOLDLOCK).',
    },
    {
      thought: 'PostgreSQL\'s ON CONFLICT and MSSQL\'s MERGE provide the identical "no race condition" guarantee out of the box, since both are described as atomic upsert mechanisms.',
      reality: 'ON CONFLICT DO UPDATE is specifically designed to be race-free against concurrent inserts by default. Plain MERGE needs the explicit WITH (HOLDLOCK) table hint on the target to get the equivalent guarantee against concurrent MERGE statements racing the same key.',
    },
    {
      thought: 'adding WITH (HOLDLOCK) to a MERGE statement is an obscure performance tuning option, not something needed for correctness.',
      reality: 'for any MERGE used as an upsert that can run concurrently for the same key (the exact scenario the main page\'s opening theory describes), HOLDLOCK is what actually closes the race condition gap -- without it, the primary-key violation shown above is a real, reproducible outcome, not a hypothetical.',
    },
  ];
}
