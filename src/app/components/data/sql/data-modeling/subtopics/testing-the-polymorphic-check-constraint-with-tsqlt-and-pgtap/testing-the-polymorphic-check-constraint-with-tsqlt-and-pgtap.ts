import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-polymorphic-check-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-the-polymorphic-check-constraint-with-tsqlt-and-pgtap.html',
  styleUrl: './testing-the-polymorphic-check-constraint-with-tsqlt-and-pgtap.scss',
})
export class TestingThePolymorphicCheckConstraintWithTsqltAndPgtapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Page\'s Own "Exactly One Parent" CHECK Is Never Verified Under Test',
      points: [
        'The main page\'s own polymorphic-association CHECK — ck_comments_one_parent — is written to require EXACTLY one of post_id or video_id to be non-NULL, never both and never neither. But the page only ever shows the constraint\'s DEFINITION, not proof that it actually rejects both invalid states. A CHECK expression with boolean logic like this is exactly the kind of thing worth testing directly: it is easy to get subtly wrong (e.g. using OR instead of XOR-style logic, or forgetting one of the two NULL checks) in a way that looks correct on casual reading but silently permits an invalid row.',
        'A single test proving "one parent succeeds" is not enough — a genuinely thorough test suite needs THREE cases: both FKs NULL (should fail), both FKs set (should fail), and exactly one set (should succeed). Missing any one of these leaves a real gap: a constraint that correctly rejects "both NULL" but silently accepts "both set" is still broken, even though the happy path works.',
      ],
    },
    {
      heading: 'Why All Three Cases Matter for THIS Specific Constraint Shape',
      points: [
        'A constraint like CHECK ((a IS NOT NULL AND b IS NULL) OR (a IS NULL AND b IS NOT NULL)) is a classic case where a maintainer "simplifying" it to CHECK (a IS NOT NULL OR b IS NOT NULL) changes its meaning from "exactly one" to "at least one" — silently permitting a comment attached to BOTH a post and a video. Only a test that specifically tries the "both set" case would catch that particular regression; a test suite that only tries "both NULL" and "one set" would stay green even after this exact bug was introduced.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'tSQLt — all three cases for the polymorphic CHECK',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'PolymorphicCommentTests';
GO

CREATE PROCEDURE PolymorphicCommentTests.[test rejects comment with neither parent]
AS
BEGIN
    EXEC tSQLt.ExpectException @ExpectedMessagePattern = '%CHECK constraint%';
    INSERT INTO Comments (PostID, VideoID, Body) VALUES (NULL, NULL, 'orphan comment');
END;
GO

CREATE PROCEDURE PolymorphicCommentTests.[test rejects comment with both parents]
AS
BEGIN
    EXEC tSQLt.ExpectException @ExpectedMessagePattern = '%CHECK constraint%';
    INSERT INTO Comments (PostID, VideoID, Body) VALUES (1, 1, 'double-parented comment');
END;
GO

CREATE PROCEDURE PolymorphicCommentTests.[test accepts comment with exactly one parent]
AS
BEGIN
    -- No ExpectException here — this INSERT should succeed cleanly.
    INSERT INTO Comments (PostID, VideoID, Body) VALUES (1, NULL, 'valid post comment');
    EXEC tSQLt.AssertEquals 1, (SELECT COUNT(*) FROM Comments WHERE PostID = 1);
END;
GO

EXEC tSQLt.Run 'PolymorphicCommentTests';
-- All three tests run inside their own auto-rolled-back transaction —
-- nothing persists between test runs.`,
    },
    {
      label: 'pgTAP — the same three cases, PostgreSQL',
      language: 'sql',
      code: `BEGIN;
SELECT plan(3);

SELECT throws_ok(
    $$ INSERT INTO comments (post_id, video_id, body) VALUES (NULL, NULL, 'orphan') $$,
    '23514',   -- SQLSTATE for check_violation
    NULL,
    'rejects a comment with neither post_id nor video_id set'
);

SELECT throws_ok(
    $$ INSERT INTO comments (post_id, video_id, body) VALUES (1, 1, 'double-parented') $$,
    '23514',
    NULL,
    'rejects a comment with BOTH post_id and video_id set'
);

SELECT lives_ok(
    $$ INSERT INTO comments (post_id, video_id, body) VALUES (1, NULL, 'valid') $$,
    'accepts a comment with exactly one parent set'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "simplifies" the CHECK constraint from <code>CHECK ((post_id IS NOT NULL AND video_id IS NULL) OR (post_id IS NULL AND video_id IS NOT NULL))</code> to <code>CHECK (post_id IS NOT NULL OR video_id IS NOT NULL)</code>, reasoning it is shorter and "means the same thing." Using the three tests above, which one catches this regression, and which ones stay green despite the bug?',
    hint: 'Work out what the SIMPLIFIED expression actually permits that the ORIGINAL one rejected — try plugging in "both set" and "neither set" against both versions.',
    solution: `The simplified CHECK (post_id IS NOT NULL OR video_id IS NOT NULL)
means "AT LEAST ONE," not "EXACTLY ONE" — it now permits a row with
BOTH post_id and video_id set. The "rejects comment with BOTH parents"
test is the ONE that catches this regression: it expects an exception
on inserting (1, 1, ...), but the simplified constraint now allows
that insert to succeed, so the test fails (no exception was thrown
where one was expected).

The other two tests stay GREEN despite the bug: "rejects comment with
neither parent" still correctly fails the (NULL, NULL, ...) insert,
since OR still requires at least one non-NULL value — that behavior
didn't change. "accepts comment with exactly one parent" also still
passes, since (1, NULL, ...) is still accepted under either version of
the constraint. This is exactly why all three cases are necessary: a
test suite missing the "both set" case would have shipped this
regression silently, with 2 out of 3 tests still reporting success.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a polymorphic "exactly one parent" CHECK constraint just requires one test proving a valid row (with one parent set) inserts successfully.',
      reality: 'a constraint that correctly accepts the happy path can still be broken in a way that silently permits invalid states — testing requires BOTH invalid cases (neither set, both set) in addition to the valid case, since each exercises a different part of the boolean expression.',
    },
    {
      thought: 'CHECK (post_id IS NOT NULL OR video_id IS NOT NULL) and CHECK ((post_id IS NOT NULL AND video_id IS NULL) OR (post_id IS NULL AND video_id IS NOT NULL)) enforce the same rule, just written differently.',
      reality: 'the first expression means "at least one" and permits both being set; the second means "exactly one" and rejects both being set — they are NOT equivalent, and only a test that specifically inserts a row with BOTH parents set would reveal the difference.',
    },
    {
      thought: 'a test suite with tests for "both NULL rejected" and "one set accepted" provides adequate coverage for an exactly-one-of-two-columns constraint.',
      reality: 'without a THIRD test for "both set," a regression that weakens the constraint from "exactly one" to "at least one" ships with the existing two tests still fully green.',
    },
  ];
}
