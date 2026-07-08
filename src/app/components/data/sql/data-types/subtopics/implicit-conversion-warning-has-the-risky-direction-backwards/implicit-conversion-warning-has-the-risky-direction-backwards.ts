import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-implicit-conversion-warning-backwards-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './implicit-conversion-warning-has-the-risky-direction-backwards.html',
  styleUrl: './implicit-conversion-warning-has-the-risky-direction-backwards.scss',
})
export class ImplicitConversionWarningHasTheRiskyDirectionBackwardsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Comment Has the Risky Case Backwards',
      points: [
        'The main page\'s own "Implicit conversion pitfall" comment states: WHERE nvarchar_col = \'literal\' -- implicit conversion: bad for indexes, and WHERE nvarchar_col = N\'literal\' -- no conversion: index seek. Based on SQL Server\'s documented data type precedence rules — nvarchar ranks HIGHER than varchar — this has the risky direction backwards. When comparing an NVARCHAR column against a plain VARCHAR literal, it is the LOWER-precedence side, the literal, that gets implicitly converted to match. A single constant is cheap to convert once; the column itself is left untouched, and the predicate stays sargable — an index seek on the nvarchar column still works fine.',
        'The genuinely risky, well-documented case runs the OPPOSITE direction: comparing a VARCHAR column against an NVARCHAR value. Since nvarchar has higher precedence, it is the VARCHAR COLUMN — not the value being compared against it — that gets implicitly converted. Because that conversion has to be applied to every indexed row\'s value rather than a single constant, the predicate becomes non-sargable and the optimizer typically falls back to a scan instead of a seek.',
      ],
    },
    {
      heading: 'Why This Shows Up in Real Applications, Not Just Hand-Written SQL',
      points: [
        'This rarely comes from someone hand-writing an N-prefixed literal by mistake — it comes from application code. ADO.NET\'s SqlParameter defaults a .NET string parameter to NVARCHAR unless the type is set explicitly. Any parameterized query that compares a VARCHAR column against one of these default parameters silently hits the exact column-conversion problem described above, on every single execution, with no error and no obvious symptom besides an unexpectedly slow query.',
      ],
    },
    {
      heading: 'The Fix Runs the Opposite Direction From a Literal Reading of the Main Page',
      points: [
        'When a column is VARCHAR, make sure any literal or parameter compared against it is ALSO VARCHAR — no N prefix, and for application code, an explicitly set SqlDbType.VarChar rather than the NVARCHAR default. When a column is genuinely NVARCHAR, an N-prefixed literal remains a good habit for correct Unicode storage on INSERT (as the main page\'s own earlier "José" example correctly shows) — but it is not required to protect an index seek on a SELECT predicate against that same column, since type precedence already favors the column in that comparison.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — the comment\'s example is actually fine',
      language: 'sql',
      code: `-- Setup: full_name is genuinely NVARCHAR, indexed
CREATE TABLE contacts (id INT IDENTITY PRIMARY KEY, full_name NVARCHAR(200));
CREATE INDEX ix_contacts_name ON contacts(full_name);

-- The main page's own comment calls this "bad for indexes":
SELECT * FROM contacts WHERE full_name = 'Jose Garcia';
-- Per data type precedence, the LITERAL (lower precedence) converts to
-- match the NVARCHAR column -- the column itself is untouched.
-- Actual execution plan: Index Seek on ix_contacts_name.
-- This case is FINE -- contrary to what the comment implies.`,
    },
    {
      label: 'MSSQL — the genuinely risky direction',
      language: 'sql',
      code: `-- Setup: code is genuinely VARCHAR, indexed
CREATE TABLE legacy_codes (id INT IDENTITY PRIMARY KEY, code VARCHAR(20));
CREATE INDEX ix_legacy_codes ON legacy_codes(code);

SELECT * FROM legacy_codes WHERE code = N'ABC123';
-- Per data type precedence, the VARCHAR COLUMN (lower precedence) is
-- what gets implicitly converted this time -- every indexed value must
-- be converted to NVARCHAR before comparing.
-- Actual execution plan: Index Scan on ix_legacy_codes (NOT a seek) --
-- this is the genuinely risky direction the main page's comment misses.`,
    },
    {
      label: 'The application-code angle',
      language: 'sql',
      code: `-- In practice this rarely comes from a hand-written N-prefixed
-- literal -- it comes from application code sending string parameters
-- as NVARCHAR by default (ADO.NET's SqlParameter default for a string):

DECLARE @code NVARCHAR(20) = 'ABC123';   -- .NET string parameter default
SELECT * FROM legacy_codes WHERE code = @code;
-- Same problem: code (VARCHAR) gets implicitly converted -- Index Scan.

-- Fix in application code: explicitly set the parameter type, e.g.
--   command.Parameters.Add("@code", SqlDbType.VarChar, 20).Value = "ABC123";
-- instead of leaving it to default to NVARCHAR.

-- Fix in raw T-SQL: match the literal's type to the COLUMN's type:
DECLARE @code2 VARCHAR(20) = 'ABC123';
SELECT * FROM legacy_codes WHERE code = @code2;
-- Index Seek -- no conversion needed on either side.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A .NET application queries a <code>VARCHAR(20)</code> column with a C# string parameter, without explicitly specifying the parameter\'s <code>SqlDbType</code>. Using the mechanics above, what execution plan should the team expect to see, and what\'s the one-line fix?',
    hint: 'Think about what SqlDbType a C# string maps to by default when no explicit type is specified, then compare that against the column\'s actual declared type.',
    solution: `By default, a .NET string parameter maps to NVARCHAR unless told
otherwise -- meaning the query effectively becomes
WHERE varchar_column = @nvarchar_parameter. Per the mechanics above,
the LOWER-precedence side -- the VARCHAR column -- is what gets
implicitly converted, defeating the index and forcing an Index Scan
instead of an Index Seek, exactly the scenario in the second code tab.

The one-line fix is to explicitly specify the parameter's SQL type to
match the column -- in raw ADO.NET,
command.Parameters.Add("@code", SqlDbType.VarChar, 20).Value = code;
instead of letting the driver default the parameter to NVARCHAR. This
removes the implicit conversion entirely, since both sides of the
comparison are now VARCHAR, and the optimizer can use a proper Index
Seek again.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'as the main page\'s own comment states, <code>WHERE nvarchar_col = \'literal\'</code> (a plain literal against an NVARCHAR column) causes an implicit conversion that prevents an index seek.',
      reality: 'per SQL Server\'s data type precedence rules, the LOWER-precedence literal gets converted to match the higher-precedence NVARCHAR column -- the column itself is untouched, and the predicate remains sargable. An index seek still works fine in this direction.',
    },
    {
      thought: 'adding the N prefix to every string literal or parameter compared against an NVARCHAR column is what protects index seek performance.',
      reality: 'the N prefix on a literal matters for correct Unicode STORAGE on INSERT, but for a SELECT predicate, type precedence already favors the NVARCHAR column -- the N prefix isn\'t what protects the seek in that direction.',
    },
    {
      thought: 'implicit VARCHAR/NVARCHAR conversion performance problems are a rare, deliberately-constructed edge case, not something that occurs in ordinary application code.',
      reality: 'this is one of the most commonly cited real-world MSSQL performance problems -- it happens by default whenever a .NET (or similar) application sends a string parameter without explicitly specifying VARCHAR, since NVARCHAR is the typical driver default, silently converting VARCHAR columns and defeating their indexes on every query.',
    },
  ];
}
