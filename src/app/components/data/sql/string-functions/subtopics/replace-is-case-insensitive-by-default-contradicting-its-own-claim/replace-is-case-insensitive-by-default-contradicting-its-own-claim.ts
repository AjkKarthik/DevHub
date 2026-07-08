import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-replace-case-insensitive-default-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './replace-is-case-insensitive-by-default-contradicting-its-own-claim.html',
  styleUrl: './replace-is-case-insensitive-by-default-contradicting-its-own-claim.scss',
})
export class ReplaceIsCaseInsensitiveByDefaultContradictingItsOwnClaimSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Claims on the Same Page That Don\'t Line Up',
      points: [
        'The main page\'s first theory section states as a general rule: "String comparisons in MSSQL are case-insensitive by default (controlled by collation)." A few sections later, under "Cleaning and transforming," it states: "REPLACE(s, old, new) is case-sensitive in MSSQL (unless collation is CI)." Read together, this second claim implies REPLACE is case-sensitive BY DEFAULT, with CI collation as the exception — the opposite of what the first claim already established as the actual default.',
        'Since MSSQL\'s default collation IS a CI (case-insensitive) collation — Latin1_General_CI_AS being the typical example the page itself names elsewhere — REPLACE is, in fact, case-INsensitive on a default installation. The "unless collation is CI" phrasing has it backwards: CI isn\'t the exception, it\'s the default. Case-sensitive REPLACE only happens under an explicit CS (case-sensitive) collation.',
      ],
    },
    {
      heading: 'How REPLACE Actually Follows Collation',
      points: [
        'REPLACE(s, old, new), like most MSSQL string functions, performs its old-value matching using the collation of its input — not a fixed, byte-for-byte comparison. Under a CI collation (the default), REPLACE(\'Hello World\', \'hello\', \'Goodbye\') DOES find and replace the match, even though the case doesn\'t line up literally.',
        'To force genuinely case-sensitive REPLACE behavior on a default (CI) server, you apply an explicit binary or CS collation to the input: REPLACE(s COLLATE Latin1_General_CS_AS, old, new).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the default collation is CI',
      language: 'sql',
      code: `SELECT SERVERPROPERTY('Collation');
-- SQL_Latin1_General_CP1_CI_AS  -- 'CI' = case-insensitive
-- This is the standard default for most SQL Server installations.`,
    },
    {
      label: 'REPLACE under the default (CI) collation — case is ignored',
      language: 'sql',
      code: `DECLARE @s VARCHAR(50) = 'Hello World';

SELECT REPLACE(@s, 'hello', 'Goodbye') AS result;
-- 'Goodbye World'
--
-- Despite the lowercase 'hello' not matching the literal capitalization
-- of 'Hello' in @s, REPLACE finds and replaces it anyway -- because the
-- default CI collation makes 'hello' and 'Hello' compare as equal for
-- this operation. This directly contradicts a plain reading of the
-- main page's "REPLACE is case-sensitive in MSSQL" statement -- on an
-- out-of-the-box server, it is not.`,
    },
    {
      label: 'Forcing genuinely case-sensitive REPLACE',
      language: 'sql',
      code: `DECLARE @s VARCHAR(50) = 'Hello World';

SELECT REPLACE(@s COLLATE Latin1_General_CS_AS, 'hello', 'Goodbye') AS result;
-- 'Hello World'  -- unchanged: 'hello' (lowercase) no longer matches
--                    'Hello' (capitalized) once a CS collation is forced

SELECT REPLACE(@s COLLATE Latin1_General_CS_AS, 'Hello', 'Goodbye') AS result;
-- 'Goodbye World'  -- matches now that the case lines up exactly

-- This is the ONLY way to get the case-sensitive REPLACE behavior the
-- main page's "Cleaning and transforming" section describes as the
-- default -- it requires an explicit COLLATE clause, not the server's
-- out-of-the-box configuration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes REPLACE(sku, \'ABC\', \'XYZ\') expecting it to leave a row with sku = \'abc-100\' untouched, "because REPLACE is case-sensitive in SQL Server" (quoting the main page). Running it on their default-configured database, what actually happens, and why?',
    hint: 'Check SERVERPROPERTY(\'Collation\') on a fresh, out-of-the-box SQL Server install — is it a CI or CS collation?',
    solution: `The row with sku = 'abc-100' WILL be affected -- REPLACE will match
the lowercase 'abc' against the search string 'ABC' and produce
'XYZ-100', because a default, out-of-the-box SQL Server installation
uses a CI (case-insensitive) collation, and REPLACE follows the
collation of its input.

The developer's expectation was based on a literal reading of the main
page's "REPLACE(s, old, new) is case-sensitive in MSSQL (unless
collation is CI)" statement, taken as the default behavior -- but the
"unless" condition IS the actual default on essentially every
out-of-the-box SQL Server instance. To get the case-sensitive behavior
the developer actually wants, they need to explicitly force it:
REPLACE(sku COLLATE Latin1_General_CS_AS, 'ABC', 'XYZ').`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'REPLACE(s, old, new) is case-sensitive by default in SQL Server, the way the main page\'s "Cleaning and transforming" section states.',
      reality: 'on essentially every out-of-the-box SQL Server installation, the default collation is CI (case-insensitive), and REPLACE follows that collation -- meaning REPLACE is case-INsensitive by default, matching \'hello\' against \'Hello\'.',
    },
    {
      thought: '"unless collation is CI" in the main page\'s phrasing describes a rare, opt-in exception a DBA would have to deliberately configure.',
      reality: 'CI is the standard, out-of-the-box default collation family for SQL Server (e.g. SQL_Latin1_General_CP1_CI_AS) -- it is the common case, not the exception; genuinely case-sensitive behavior is what requires an explicit COLLATE override.',
    },
    {
      thought: 'REPLACE always performs a literal, byte-for-byte string match regardless of collation, the same way it would in a case-sensitive programming language.',
      reality: 'REPLACE\'s matching behavior is entirely collation-driven in MSSQL -- the exact same REPLACE call produces different results depending on the collation of its input string, which is why forcing COLLATE Latin1_General_CS_AS is the standard way to get literal, case-sensitive matching.',
    },
  ];
}
