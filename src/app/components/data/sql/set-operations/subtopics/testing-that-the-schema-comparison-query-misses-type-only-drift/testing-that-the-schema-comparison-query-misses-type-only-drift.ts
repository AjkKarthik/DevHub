import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-schema-comparison-misses-type-drift-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-schema-comparison-query-misses-type-only-drift.html',
  styleUrl: './testing-that-the-schema-comparison-query-misses-type-only-drift.scss',
})
export class TestingThatTheSchemaComparisonQueryMissesTypeOnlyDriftSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Only Column Names Are Compared — Types Are Invisible to This Query',
      points: [
        'The main page\'s own "Practical: schema comparison" tab selects only column_name from information_schema.columns, comparing source vs target via EXCEPT. This correctly detects columns that were ADDED or REMOVED entirely — but it is structurally incapable of detecting a column that exists in both tables under the exact same name with a DIFFERENT type, since data_type, character_maximum_length, and every other type-describing column is never included in the SELECT list at all.',
        'A column silently shrinking from VARCHAR(100) to VARCHAR(50) between source and target is a genuinely dangerous kind of schema drift — it risks silent data truncation on the next INSERT or migration — and the main page\'s own query, run exactly as written, reports zero drift for this scenario, since column_name (\'email\') is identical in both tables.',
      ],
    },
    {
      heading: 'The Fix Widens What EXCEPT Actually Compares',
      points: [
        'EXCEPT compares entire rows, not just a single column — including additional columns from information_schema.columns (data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable) in the SELECT list means EXCEPT now catches ANY difference in those attributes for a given column_name, not just its presence or absence.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the missed detection — the main page\'s own query, literally',
      language: 'sql',
      code: `-- Source: email column with full-length VARCHAR
CREATE TABLE source_table (email VARCHAR(100));
-- Target: SAME column name, but silently narrower --
-- e.g. from a migration that copy-pasted a different table's definition
CREATE TABLE target_table (email VARCHAR(50));

-- The main page's own schema-drift query, exactly as written:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'source_table'
EXCEPT
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'target_table';
-- Returns ZERO rows -- "email" exists in both tables under the same
-- name, so nothing looks different to THIS query, even though
-- target_table's email column can silently truncate any value over
-- 50 characters that source_table would have stored intact.`,
    },
    {
      label: 'The fix — compare type-describing columns too',
      language: 'sql',
      code: `SELECT column_name, data_type, character_maximum_length,
       numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_name = 'source_table'
EXCEPT
SELECT column_name, data_type, character_maximum_length,
       numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_name = 'target_table';
-- Returns ONE row: ('email', 'character varying', 100, NULL, NULL, ...)
-- The row from source_table has no matching row in target_table's
-- results now, because character_maximum_length differs (100 vs 50) --
-- EXCEPT compares the WHOLE row, and this drift is finally visible.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs the main page\'s own schema-drift query nightly in CI and it has reported "no drift" for months, giving confidence that source_table and target_table stay in sync. A production incident later reveals that target_table\'s email column has been VARCHAR(50) for that entire time, silently truncating long email addresses on every INSERT, while source_table has always been VARCHAR(100). Using the mechanics above, explain why months of "no drift" reports were consistent with this bug existing the whole time.',
    hint: 'Check exactly which columns the CI query actually selects from information_schema.columns, and whether any of them would ever reflect a type or length difference.',
    solution: `The "no drift" reports were entirely consistent with the bug existing
the whole time, because the CI query only ever compared column_name --
a value that was identical ('email') in both tables for the entire
duration. The query never selected data_type or
character_maximum_length, so it had no way to observe the VARCHAR(50)
vs VARCHAR(100) difference at all; from this query's perspective, the
two tables' schemas looked identical every single night, regardless of
how long the length mismatch had actually existed.

This is not a case of the query missing a recent change -- it
structurally cannot detect THIS CLASS of change at all, no matter how
long it runs or how often. Only widening the SELECT list to include
type-describing columns (as in the second code tab) would have
surfaced the drift on the very first run after target_table was
created with the wrong length.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own "Practical: schema comparison" query, since it uses EXCEPT to compare column_name across two tables, provides comprehensive schema drift detection.',
      reality: 'it only detects columns that were entirely ADDED or REMOVED — a column that exists under the same name in both tables but with a different type, length, precision, or nullability is completely invisible to this specific query, since none of those attributes are included in the comparison.',
    },
    {
      thought: 'a schema-drift detection query that has run for months without reporting any differences provides strong evidence that no schema drift has occurred during that time.',
      reality: 'the query only provides evidence about the SPECIFIC attributes it actually compares — a query comparing only column_name provides zero evidence about type or length drift, regardless of how many times it has run or how long it has been running.',
    },
    {
      thought: 'a VARCHAR column silently shrinking from a longer to a shorter length between two tables is a low-risk, mostly cosmetic schema difference.',
      reality: 'a shrinking VARCHAR length risks silent truncation of any value that exceeds the new, shorter limit — a real data-integrity risk, not merely a cosmetic difference, and one specifically worth detecting in an automated schema-drift check.',
    },
  ];
}
