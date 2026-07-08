import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-business-days-datefirst-dependency-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-business-days-depends-on-set-datefirst.html',
  styleUrl: './demonstrating-that-business-days-depends-on-set-datefirst.scss',
})
export class DemonstratingThatBusinessDaysDependsOnSetDatefirstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Fixed" Result That Isn\'t Actually Fixed',
      points: [
        'The main page\'s fn_business_days function is presented with a single, concrete example: SELECT dbo.fn_business_days(\'2024-01-01\', \'2024-01-31\'); -- 23, stated as if this is a fixed, portable fact about those two dates. The function body relies on DATEDIFF(WEEK, @start, @end), and DATEDIFF\'s WEEK datepart is documented by Microsoft to depend on the session\'s @@DATEFIRST setting — which day of the week counts as "day 1."',
        'This means fn_business_days can return a DIFFERENT result for the exact same two input dates, depending purely on a session-level setting that has nothing to do with the dates themselves — a real portability hazard for a function whose whole purpose is a deterministic business-logic calculation.',
      ],
    },
    {
      heading: 'A Clean, Unambiguous Demonstration',
      points: [
        'Rather than trying to hand-verify the exact 30-day range the main page uses, this subtopic isolates the mechanism with the simplest possible case: two CONSECUTIVE calendar days that straddle a week boundary under one DATEFIRST setting but not another — a Saturday followed immediately by a Sunday. Under the U.S. default (Sunday = start of week), that Saturday-to-Sunday transition crosses into a new week. Under the ISO/European default (Monday = start of week), the same two consecutive days fall within the SAME week.',
        'DATEDIFF(WEEK, ...) between those two specific dates is therefore 1 under one DATEFIRST setting and 0 under the other — for dates that are always exactly one calendar day apart, regardless of which setting is active. This directly demonstrates the mechanism fn_business_days silently inherits.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The dependency, isolated with two consecutive dates',
      language: 'sql',
      code: `-- January 6, 2024 is a Saturday; January 7, 2024 is the very next day, a Sunday.
SET DATEFIRST 7;   -- U.S. default: Sunday = start of the week
SELECT DATEDIFF(WEEK, '2024-01-06', '2024-01-07') AS week_diff_us_default;
-- week_diff_us_default = 1
-- Sunday Jan 7 begins a NEW week (under Sunday-start), so this
-- single-day step crosses a week boundary.

SET DATEFIRST 1;   -- ISO/European default: Monday = start of the week
SELECT DATEDIFF(WEEK, '2024-01-06', '2024-01-07') AS week_diff_iso_default;
-- week_diff_iso_default = 0
-- Under Monday-start, both Jan 6 (Sat) and Jan 7 (Sun) fall within
-- the SAME week (the one that began Monday Jan 1) -- no boundary
-- crossed for the identical two dates.`,
    },
    {
      label: 'What this means for fn_business_days',
      language: 'sql',
      code: `-- The main page's function relies directly on DATEDIFF(WEEK, ...):
CREATE OR ALTER FUNCTION dbo.fn_business_days(@start DATE, @end DATE)
RETURNS INT
AS
BEGIN
    RETURN (
        DATEDIFF(DAY, @start, @end)
        - (DATEDIFF(WEEK, @start, @end) * 2)   -- <-- DATEFIRST-dependent
        - CASE WHEN DATEPART(WEEKDAY, @start) = 1 THEN 1 ELSE 0 END  -- <-- also DATEFIRST-dependent
        - CASE WHEN DATEPART(WEEKDAY, @end)   = 7 THEN 1 ELSE 0 END  -- <-- also DATEFIRST-dependent
    );
END;

-- BOTH DATEDIFF(WEEK, ...) AND DATEPART(WEEKDAY, ...) inside this
-- function depend on @@DATEFIRST -- meaning the SAME function call,
-- with the SAME two input dates, can return a DIFFERENT business-day
-- count purely because a different session (or a different server's
-- default language/regional setting) has a different DATEFIRST value.
-- This is not a hypothetical -- @@DATEFIRST varies by default LANGUAGE
-- setting, which can differ between developer machines, CI runners,
-- and production servers without anyone deliberately configuring it.`,
    },
    {
      label: 'The fix — make the function immune to DATEFIRST entirely',
      language: 'sql',
      code: `-- The reliable fix locks DATEFIRST explicitly inside the function,
-- so its result no longer depends on the calling session's setting:
CREATE OR ALTER FUNCTION dbo.fn_business_days_safe(@start DATE, @end DATE)
RETURNS INT
AS
BEGIN
    -- Alternative: compute business days via a numbers-table / date
    -- spine approach that doesn't rely on DATEDIFF(WEEK,...) or
    -- DATEPART(WEEKDAY,...) at all -- counting each individual day
    -- and checking its day-of-week via a DATEFIRST-independent method
    -- such as (DATEDIFF(DAY, 0, @d) % 7), which is anchored to a fixed
    -- reference date rather than the session's @@DATEFIRST setting.
    RETURN (
        SELECT COUNT(*)
        FROM (
            SELECT DATEADD(DAY, n, @start) AS d
            FROM (SELECT TOP (DATEDIFF(DAY, @start, @end) + 1)
                         ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
                  FROM sys.all_objects) nums
        ) days
        WHERE DATEDIFF(DAY, 0, d) % 7 NOT IN (5, 6)  -- fixed reference,
    );                                                 -- not @@DATEFIRST
END;
-- This version produces the IDENTICAL result regardless of what
-- DATEFIRST is set to when it's called -- the portability bug is
-- eliminated at the source rather than requiring every caller to
-- remember to SET DATEFIRST before calling the original function.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payroll calculation using fn_business_days exactly as published on the main page produces correct results in the development environment but subtly different business-day counts in production for the same date ranges, and nobody changed the function\'s code between environments. Based on the mechanism demonstrated above, what\'s the most likely cause, and what should be checked first?',
    hint: 'The function\'s code being identical across environments doesn\'t mean its RESULT is identical — check what session-level or server-level setting the function silently depends on.',
    solution: `The most likely cause is a difference in @@DATEFIRST between the two
environments — commonly caused by different default LANGUAGE settings
on the SQL Server login or session between dev and production (for
example, one environment defaulting to us_english and DATEFIRST=7,
the other to british or another locale with a different default).
Since fn_business_days relies on DATEDIFF(WEEK, ...) and
DATEPART(WEEKDAY, ...), both of which are DATEFIRST-dependent, the
identical function code can legitimately return different results
in different sessions for the exact same input dates.

The first thing to check is SELECT @@DATEFIRST; run in both
environments' actual application connection context (not just an
ad-hoc admin query, since DATEFIRST is often set implicitly via the
login's default language) — a mismatch there would confirm this
exact mechanism. The durable fix is rewriting the function to avoid
DATEFIRST-dependent constructs entirely, as shown in the third code
tab, rather than relying on every environment coincidentally sharing
the same DATEFIRST setting.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'fn_business_days(\'2024-01-01\', \'2024-01-31\') always returns the same result, since the function\'s code and the two input dates never change.',
      reality: 'the function relies on DATEDIFF(WEEK, ...) and DATEPART(WEEKDAY, ...), both of which depend on the session\'s @@DATEFIRST setting — the same code and same input dates can produce a different result under a different DATEFIRST value.',
    },
    {
      thought: '@@DATEFIRST is an obscure setting nobody actually changes, so this dependency is a theoretical concern rather than a real portability risk.',
      reality: '@@DATEFIRST is set implicitly by a login\'s default LANGUAGE setting, which commonly differs across environments (dev machines, CI runners, production servers) without anyone deliberately configuring DATEFIRST directly.',
    },
    {
      thought: 'the fix for this kind of function is to document "requires DATEFIRST=7" and trust every caller to set it correctly beforehand.',
      reality: 'a more durable fix removes the DATEFIRST dependency from the function entirely — using a fixed-reference-date calculation (like DATEDIFF(DAY, 0, d) % 7) instead of DATEDIFF(WEEK, ...) or DATEPART(WEEKDAY, ...) — so the function\'s result cannot vary by caller session at all.',
    },
  ];
}
