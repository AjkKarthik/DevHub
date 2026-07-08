import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-islands-and-gaps-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-islands-and-gaps-pattern-actually-splits-on-a-real-gap.html',
  styleUrl: './testing-that-the-islands-and-gaps-pattern-actually-splits-on-a-real-gap.scss',
})
export class TestingThatTheIslandsAndGapsPatternActuallySplitsOnARealGapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Clever Trick Is Never Actually Demonstrated Against a Real Gap',
      points: [
        'The main page\'s own "Gap analysis — consecutive date groups" pattern computes GroupKey = DATEADD(DAY, -rn, LoginDate), claiming rows in the same "island" (a run of consecutive days) share the same GroupKey. This is a genuinely clever trick — subtracting a strictly increasing row number from a strictly increasing date produces a CONSTANT value exactly when the dates are consecutive — but the main page never demonstrates it against a fixture that actually CONTAINS a gap. Without that, it is easy to trust the claim without confirming the algorithm correctly SPLITS into separate islands the moment a gap appears, rather than accidentally merging everything into one group.',
        'A small, hand-verifiable fixture makes this concrete: a user who logs in on days 1, 2, and 3 (island one), then skips days 4 and 5, then logs in again on days 6 and 7 (island two). The correct result is exactly two islands — (1, 3) and (6, 7) — not one merged island spanning day 1 to day 7.',
      ],
    },
    {
      heading: 'A Missing PARTITION BY Is the Realistic Failure Mode',
      points: [
        'The pattern depends entirely on ROW_NUMBER() being computed PARTITION BY UserID — without it, row numbers are assigned across ALL users\' logins combined, and the GroupKey calculation silently produces meaningless results that mix different users\' login streaks together, with no error raised.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — pgTAP test with a real gap in the fixture',
      language: 'sql',
      code: `BEGIN;
SELECT plan(1);

-- User 1: days 1-3 (island one), gap on days 4-5, days 6-7 (island two)
INSERT INTO logins (user_id, login_date) VALUES
  (1, '2026-01-01'), (1, '2026-01-02'), (1, '2026-01-03'),
  (1, '2026-01-06'), (1, '2026-01-07');

WITH numbered AS (
    SELECT user_id, login_date,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS rn
    FROM logins
),
islands AS (
    SELECT user_id, login_date,
           (login_date - (rn * INTERVAL '1 day')) AS group_key
    FROM numbered
)
SELECT is(
  (SELECT COUNT(*) FROM (
     SELECT user_id, group_key, MIN(login_date) AS island_start, MAX(login_date) AS island_end
     FROM islands GROUP BY user_id, group_key
   ) t)::int,
  2,
  'the gap correctly produces exactly two islands, not one merged run'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
    {
      label: 'Reproducing the realistic bug — missing PARTITION BY',
      language: 'sql',
      code: `-- Two DIFFERENT users, each with their own separate 3-day streak that
-- happen to overlap in calendar time:
INSERT INTO logins (user_id, login_date) VALUES
  (1, '2026-02-01'), (1, '2026-02-02'), (1, '2026-02-03'),
  (2, '2026-02-01'), (2, '2026-02-02'), (2, '2026-02-03');

-- Correct: PARTITION BY user_id keeps row numbering separate per user
WITH numbered_correct AS (
    SELECT user_id, login_date,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS rn
    FROM logins
)
SELECT user_id, (login_date - (rn * INTERVAL '1 day')) AS group_key
FROM numbered_correct;
-- Each user gets their OWN group_key -- 2 correct, separate islands.

-- BUGGY: forgetting PARTITION BY -- row numbers span across BOTH users
WITH numbered_buggy AS (
    SELECT user_id, login_date,
           ROW_NUMBER() OVER (ORDER BY login_date) AS rn   -- missing PARTITION BY!
    FROM logins
)
SELECT user_id, (login_date - (rn * INTERVAL '1 day')) AS group_key
FROM numbered_buggy;
-- Row numbers interleave across BOTH users' logins on the same dates,
-- producing group_key values that no longer correspond to a single
-- user's actual consecutive-day streak -- the query still runs
-- without error, but the "island" grouping is now meaningless.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "login streaks" report built on the main page\'s own islands-and-gaps pattern is copied to a new query that reports on login streaks PER TEAM instead of per user, but the developer forgets to change <code>PARTITION BY user_id</code> to <code>PARTITION BY team_id</code> — and also removes the user_id partition without adding the team one, leaving no PARTITION BY at all. Using the test pattern above, how would this be caught, and what would go wrong in production if it wasn\'t?',
    hint: 'Think about what ROW_NUMBER() OVER (ORDER BY login_date) — with no PARTITION BY at all — actually numbers, across how many different users or teams at once.',
    solution: `A test fixture with two or more distinct users/teams whose login dates
overlap (as in the second code tab) would immediately reveal the bug:
the "correct" query (with the right PARTITION BY) produces one
group_key value per user's own actual streak, while the buggy query
(missing PARTITION BY) produces group_key values computed across ALL
users combined, mixing unrelated login streaks together under
overlapping row numbers.

In production without this test, the report would silently produce
"streaks" that don't correspond to any single user or team's real
login pattern -- rows from different users could end up sharing a
group_key purely by coincidence of overlapping dates and row-number
ordering, and the resulting MIN/MAX island boundaries would be
meaningless, all while the query runs successfully and returns
plausible-looking dates.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own islands-and-gaps comment ("same GroupKey = consecutive days") is proof enough that the pattern correctly handles a real gap in the data — the underlying arithmetic clearly makes sense on its own.',
      reality: 'the arithmetic being sound in theory does not guarantee it was implemented correctly for a specific table (e.g. missing PARTITION BY) — a test against a fixture that actually contains a gap AND multiple partitions is the only way to confirm both the splitting behavior and the partitioning are correct together.',
    },
    {
      thought: 'forgetting PARTITION BY in the ROW_NUMBER() step of an islands-and-gaps query would cause an obvious error or empty result, making the mistake easy to spot.',
      reality: 'the query runs successfully and returns a full, plausible-looking result set even with the PARTITION BY missing — the corruption is silent, mixing unrelated groups\' data together with no indication anything is wrong.',
    },
    {
      thought: 'the islands-and-gaps pattern only needs to be tested against a dataset with NO gaps, to confirm it does not incorrectly split up a genuinely consecutive run.',
      reality: 'testing only the no-gap case misses the pattern\'s actual purpose — detecting and correctly separating real gaps is the harder, more important behavior to verify, and the main page\'s own example never demonstrates it at all.',
    },
  ];
}
