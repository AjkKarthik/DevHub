import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-isnull-truncation-risk-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './isnull-can-silently-truncate-a-bigger-reason-than-portability.html',
  styleUrl: './isnull-can-silently-truncate-a-bigger-reason-than-portability.scss',
})
export class IsnullCanSilentlyTruncateABiggerReasonThanPortabilitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Names One Reason to Prefer COALESCE — Not the Bigger One',
      points: [
        'The main page\'s own theory gives exactly one reason to prefer COALESCE over ISNULL: "ISNULL is MSSQL-only and accepts exactly two arguments. Prefer COALESCE for portability." Portability is real, but a more consequential, MSSQL-specific risk goes unmentioned entirely: ISNULL\'s OUTPUT TYPE is fixed by its FIRST argument\'s declared type — not by whichever argument\'s value actually gets returned.',
        'If the first argument is a narrower type or shorter length than the second, MSSQL silently TRUNCATES the second argument\'s value to fit the first argument\'s type — even in the exact scenario where the first argument is NULL and the second argument\'s (longer) value is what actually gets returned.',
      ],
    },
    {
      heading: 'COALESCE Considers Every Argument\'s Type, Not Just the First',
      points: [
        'COALESCE derives its result type using standard data type precedence rules across ALL of its arguments — not just the first one — typically resulting in a type wide enough to hold any of the argument values without loss. This makes COALESCE structurally safer than ISNULL for exactly this scenario, independent of the separate portability argument the main page already makes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent truncation with ISNULL',
      language: 'sql',
      code: `CREATE TABLE Contacts (
    ContactID INT IDENTITY PRIMARY KEY,
    ShortNote VARCHAR(10) NULL   -- deliberately narrow
);

INSERT INTO Contacts (ShortNote) VALUES (NULL);

-- ISNULL's result type is fixed by the FIRST argument -- ShortNote,
-- declared VARCHAR(10) -- regardless of the fallback value's length:
SELECT ISNULL(ShortNote, 'This is a much longer fallback message') AS Result
FROM Contacts;
-- Result: 'This is a '
-- The fallback string, which is what actually gets returned since
-- ShortNote IS NULL, was silently truncated to 10 characters --
-- the DECLARED length of the first argument, not the length needed
-- to hold the value actually being returned.`,
    },
    {
      label: 'COALESCE avoids the same truncation on identical data',
      language: 'sql',
      code: `SELECT COALESCE(ShortNote, 'This is a much longer fallback message') AS Result
FROM Contacts;
-- Result: 'This is a much longer fallback message'
-- COALESCE derives its result type from data type precedence across
-- ALL arguments -- here, that means the wider VARCHAR type needed to
-- hold the longer literal, so nothing is truncated.

-- Confirm this is genuinely a type-derivation difference, not a
-- value-computation difference, by checking the returned lengths directly:
SELECT
    LEN(ISNULL(ShortNote, 'This is a much longer fallback message'))    AS IsNullLen,   -- 10
    LEN(COALESCE(ShortNote, 'This is a much longer fallback message'))  AS CoalesceLen  -- 39
FROM Contacts;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A stored procedure uses <code>ISNULL(short_status_code, @default_message)</code> to provide a fallback message when a status code column is NULL, where short_status_code is declared VARCHAR(5) and @default_message can be up to 100 characters long. QA reports that fallback messages always appear cut off at 5 characters in the application, even though the procedure clearly passes the full message text as the second argument. What\'s happening, and what\'s the one-line fix?',
    hint: 'Check which of ISNULL\'s two arguments determines the OUTPUT TYPE of the whole expression — and whether that\'s the same argument whose value is actually being displayed.',
    solution: `ISNULL(short_status_code, @default_message) fixes its result type to
short_status_code's declared type -- VARCHAR(5) -- regardless of which
argument's value is actually returned. Since short_status_code is NULL
in every case QA is reporting, @default_message's full text IS what
gets returned logically, but it gets silently truncated to 5
characters first, because the overall expression's type was fixed at
VARCHAR(5) from the first argument alone.

The one-line fix is to replace ISNULL with COALESCE:
COALESCE(short_status_code, @default_message). COALESCE derives its
result type from data type precedence across BOTH arguments, so the
wider type needed to hold the full @default_message text is used
automatically -- no truncation, and no change needed to either
argument's own declared type.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own stated reason for preferring COALESCE over ISNULL -- "portability," since ISNULL is MSSQL-only -- is the main practical concern when choosing between them.',
      reality: 'ISNULL carries a separate, MSSQL-specific truncation risk that has nothing to do with portability: its result type is fixed by its first argument alone, silently truncating a longer fallback value to the first argument\'s declared length.',
    },
    {
      thought: 'ISNULL(a, b) returns a value with a type wide enough to hold whichever of a or b actually ends up being returned.',
      reality: 'ISNULL\'s result type is determined ENTIRELY by the first argument\'s declared type at compile time — it has no awareness of which argument\'s value will actually be returned at runtime, so a NULL first argument with a narrow type still truncates a wider second argument\'s value.',
    },
    {
      thought: 'since COALESCE and ISNULL are both described as "return the first non-NULL argument," they can be assumed to behave identically in every respect besides argument count and dialect support.',
      reality: 'the two functions have a genuinely different mechanism for determining their OUTPUT TYPE — COALESCE considers all arguments via standard type precedence; ISNULL fixes its type from the first argument alone — a difference that directly affects correctness, not just syntax or portability.',
    },
  ];
}
