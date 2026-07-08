import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-correcting-bankers-rounding-claim-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-bankers-rounding-claim-for-postgresql-numeric.html',
  styleUrl: './correcting-the-bankers-rounding-claim-for-postgresql-numeric.scss',
})
export class CorrectingTheBankersRoundingClaimForPostgresqlNumericSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Widely Repeated Claim, Worth Checking',
      points: [
        'The main page\'s Q&A states: "Banker\'s rounding (round half to even) rounds 0.5 to the nearest even number... PostgreSQL uses this for NUMERIC types. MSSQL uses \'round half up.\'" This framing — that PostgreSQL defaults to banker\'s rounding while MSSQL doesn\'t — is a very commonly repeated claim online, often by analogy to languages like Python 3 (whose built-in round() genuinely does use banker\'s rounding by default).',
        'It doesn\'t hold for PostgreSQL\'s NUMERIC type. PostgreSQL\'s ROUND(numeric, int) function actually rounds HALF AWAY FROM ZERO — the same behavior the page attributes only to MSSQL. ROUND(0.5) returns 1, not 0; ROUND(2.5) returns 3, not 2. Banker\'s rounding is not what NUMERIC\'s ROUND does in PostgreSQL by default.',
      ],
    },
    {
      heading: 'Where the Confusion Comes From',
      points: [
        'PostgreSQL DOES exhibit round-half-to-even behavior in some contexts — specifically for the double precision (float8) type, where ROUND() on a binary floating-point value can inherit the IEEE 754 default rounding mode of the underlying hardware/library, which is round-half-to-even. This is a genuinely different code path from the NUMERIC type\'s decimal-based ROUND implementation.',
        'The two types being conflated — NUMERIC (exact decimal, round-half-away-from-zero) and DOUBLE PRECISION (binary float, can show round-half-to-even artifacts) — is very likely the source of the "PostgreSQL uses banker\'s rounding" claim. For the DECIMAL/NUMERIC types the main page\'s own money-arithmetic section recommends for financial data, that claim is simply not accurate.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing ROUND on NUMERIC in PostgreSQL',
      language: 'sql',
      code: `SELECT
    ROUND(0.5::numeric)   AS half,      -- 1, not 0
    ROUND(1.5::numeric)   AS one_half,  -- 2
    ROUND(2.5::numeric)   AS two_half,  -- 3, not 2
    ROUND(3.5::numeric)   AS three_half,-- 4, not 4 (banker's would give 4 here too -- see next row)
    ROUND(4.5::numeric)   AS four_half; -- 5, not 4

-- If PostgreSQL's NUMERIC ROUND used round-half-to-even (banker's
-- rounding), 0.5 -> 0, 2.5 -> 2, and 4.5 -> 4 (all rounding to the
-- nearest EVEN number). Instead every .5 case here rounds UP, away
-- from zero -- the exact same rule the main page attributes only to
-- MSSQL.`,
    },
    {
      label: 'Confirming MSSQL matches — same behavior, not "the opposite"',
      language: 'sql',
      code: `SELECT
    ROUND(0.5, 0)   AS half,       -- 1
    ROUND(1.5, 0)   AS one_half,   -- 2
    ROUND(2.5, 0)   AS two_half,   -- 3
    ROUND(3.5, 0)   AS three_half, -- 4
    ROUND(4.5, 0)   AS four_half;  -- 5

-- Identical results to the PostgreSQL NUMERIC test above -- both
-- engines round half AWAY FROM ZERO for their standard decimal type.
-- There is no rounding-method divergence between MSSQL and
-- PostgreSQL's NUMERIC/DECIMAL types for financial-style values.`,
    },
    {
      label: 'Where banker\'s rounding DOES show up in PostgreSQL',
      language: 'sql',
      code: `-- The DOUBLE PRECISION (float8) type, not NUMERIC, is where
-- round-half-to-even artifacts can appear, inherited from the
-- underlying IEEE 754 floating-point representation:
SELECT round(0.5::double precision);   -- may show even-rounding
                                        -- behavior depending on the
                                        -- exact binary representation
                                        -- and platform's C library

-- This is exactly why the main page's OWN "Money arithmetic" section
-- already tells you never to use FLOAT/DOUBLE PRECISION for money --
-- for the DECIMAL/NUMERIC type it correctly recommends instead,
-- PostgreSQL's rounding is round-half-away-from-zero, matching MSSQL.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate migrating a financial report from MSSQL to PostgreSQL says "we need to adjust our ROUND() calls because Postgres uses banker\'s rounding and our totals will be off by a few cents." Based on the tests above, is this concern justified for a NUMERIC/DECIMAL column?',
    hint: 'Check what type the teammate\'s financial columns actually use — the main page\'s own advice already steers financial data toward one specific type.',
    solution: `The concern is not justified, PROVIDED the financial columns are
NUMERIC or DECIMAL (which the main page's own "Money arithmetic"
section already recommends for money, specifically warning against
FLOAT/DOUBLE PRECISION). For NUMERIC columns, PostgreSQL's ROUND()
rounds half away from zero -- identical to MSSQL's behavior -- so a
straight port of ROUND() calls on DECIMAL/NUMERIC financial columns
will produce IDENTICAL results in both databases, cent for cent.

The concern WOULD be justified only if the original MSSQL columns
were FLOAT or REAL (a type mismatch the main page separately warns
against for money) and the PostgreSQL migration used DOUBLE PRECISION
instead of NUMERIC -- in that specific scenario, floating-point
rounding artifacts (including possible round-half-to-even behavior)
could genuinely cause small discrepancies. The real fix in that case
isn't adjusting for a rounding-method difference -- it's migrating the
column to NUMERIC/DECIMAL in the first place, which the main page
already recommends for entirely separate reasons.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PostgreSQL uses banker\'s rounding (round half to even) by default for its standard NUMERIC/DECIMAL money type, unlike MSSQL which rounds half up.',
      reality: 'PostgreSQL\'s ROUND() on NUMERIC rounds half AWAY FROM ZERO, identical to MSSQL — ROUND(0.5) returns 1 and ROUND(2.5) returns 3 in both databases, not the "round to nearest even" pattern banker\'s rounding would produce.',
    },
    {
      thought: 'if a language or database is known to use banker\'s rounding somewhere (like Python 3\'s built-in round()), that behavior applies uniformly across all its numeric types.',
      reality: 'in PostgreSQL specifically, rounding behavior differs by TYPE — NUMERIC uses round-half-away-from-zero, while DOUBLE PRECISION can exhibit round-half-to-even artifacts inherited from IEEE 754 floating-point representation. The two types are not interchangeable for this purpose.',
    },
    {
      thought: 'migrating financial ROUND() calls from MSSQL to PostgreSQL always requires adjusting for a rounding-method difference between the two databases.',
      reality: 'for the NUMERIC/DECIMAL type the main page itself recommends for money, MSSQL and PostgreSQL round identically — no adjustment is needed, provided both systems use the same exact-decimal type rather than a binary floating-point one.',
    },
  ];
}
