import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-at-time-zone-dst-adjustment-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-at-time-zones-automatic-dst-adjustment-across-march.html',
  styleUrl: './demonstrating-at-time-zones-automatic-dst-adjustment-across-march.scss',
})
export class DemonstratingAtTimeZonesAutomaticDstAdjustmentAcrossMarchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Correct Claim, Never Actually Shown',
      points: [
        'The main page\'s quiz explanation states that MSSQL\'s AT TIME ZONE "uses the Windows time zone database (including DST rules), so the offset changes in March and November automatically." This is accurate — but the page never shows two concrete UTC timestamps straddling a real DST boundary to prove it. The reader has to take the claim on faith.',
        'This subtopic converts two UTC timestamps just three days apart — one before the March 2024 US "spring forward," one after — to Eastern time using the exact same fixed zone name from the main page\'s own code tab, and shows the resulting UTC offset genuinely differs.',
      ],
    },
    {
      heading: 'Why a Fixed Zone Name Can Still Produce a Variable Offset',
      points: [
        '\'Eastern Standard Time\' (the Windows zone ID) and \'America/New_York\' (the IANA zone ID PostgreSQL uses) are not fixed UTC offsets — they are references to a RULE SET that says, in effect, "use UTC-5 during standard time, UTC-4 during daylight time, and switch on these specific calendar dates." The engine looks up which rule applies based on the date of the timestamp being converted, not the date the query is run.',
        'This is precisely why storing timestamps in UTC and converting only at query time (rather than storing a pre-computed local time) is correct: the same AT TIME ZONE expression, applied to different UTC instants, correctly produces different offsets as DST rules dictate — no manual DST-adjustment logic is needed anywhere in application code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — same expression, offset changes across the DST boundary',
      language: 'sql',
      code: `-- US Eastern DST began 2024-03-10 at 2:00 AM local time (7:00 AM UTC)
DECLARE @before_dst DATETIME2 = '2024-03-09 12:00:00';  -- 3 days before
DECLARE @after_dst  DATETIME2 = '2024-03-11 12:00:00';  -- 1 day after

SELECT
    @before_dst AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time' AS before_dst_eastern,
    @after_dst  AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time' AS after_dst_eastern;

-- before_dst_eastern: 2024-03-09 07:00:00.0000000 -05:00   (EST, UTC-5)
-- after_dst_eastern:  2024-03-11 08:00:00.0000000 -04:00   (EDT, UTC-4)
--
-- The EXACT SAME expression -- AT TIME ZONE 'UTC' AT TIME ZONE
-- 'Eastern Standard Time' -- produces a -05:00 offset for one
-- timestamp and a -04:00 offset for another, just two days later,
-- purely because the underlying rule set knows March 10 is the
-- DST transition date.`,
    },
    {
      label: 'PostgreSQL — the equivalent demonstration',
      language: 'sql',
      code: `SELECT
    '2024-03-09 12:00:00'::timestamptz AT TIME ZONE 'America/New_York' AS before_dst_eastern,
    '2024-03-11 12:00:00'::timestamptz AT TIME ZONE 'America/New_York' AS after_dst_eastern;

--    before_dst_eastern   |    after_dst_eastern
-- ------------------------+------------------------
--  2024-03-09 07:00:00    |  2024-03-11 08:00:00
--
-- PostgreSQL's output for AT TIME ZONE on a timestamptz doesn't
-- print the offset directly (the result type is a plain timestamp,
-- already shifted into local wall-clock time) -- but the underlying
-- shift is identical: 5 hours behind UTC before March 10, 4 hours
-- behind UTC after. Confirm the offset explicitly:
SELECT EXTRACT(TIMEZONE_HOUR FROM '2024-03-09 12:00:00'::timestamptz AT TIME ZONE 'America/New_York') AS before_offset,
       EXTRACT(TIMEZONE_HOUR FROM '2024-03-11 12:00:00'::timestamptz AT TIME ZONE 'America/New_York') AS after_offset;
-- before_offset: -5   after_offset: -4`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer hardcodes "Eastern time is always UTC-5" as a constant in application code, planning to add -5 hours to every UTC timestamp before displaying it to US East Coast users. Using the demonstration above, explain specifically what will go wrong, and on which dates.',
    hint: 'Compare the two offsets shown in the code tabs above — are they the same, and if not, which months does the difference affect?',
    solution: `The hardcoded "-5" offset is only correct roughly half the year -- specifically during EST (Eastern Standard Time), from
early November to early March. From mid-March through early November
(Eastern Daylight Time), the correct offset is -4, not -5, as the
demonstration above shows directly: the same AT TIME ZONE conversion
produces -05:00 before March 10, 2024 and -04:00 after it.

If the developer's hardcoded -5 offset ships, every displayed
timestamp during EDT (roughly 8 months of the year) will show times
that are exactly one hour off from the correct local time -- a subtle,
easy-to-miss bug that will only "look right" during the winter months
when the hardcoded offset happens to coincide with the actual DST
state. The fix is exactly what the main page's own code demonstrates:
use AT TIME ZONE with a named zone ('Eastern Standard Time' in MSSQL,
'America/New_York' in PostgreSQL) so the engine looks up the correct
offset for each individual timestamp's own date, rather than assuming
a single fixed offset applies year-round.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Eastern Standard Time" (or "America/New_York") is just a friendlier name for a fixed UTC-5 offset — using it in AT TIME ZONE is equivalent to subtracting 5 hours.',
      reality: 'named time zones reference a rule set, not a fixed offset — the SAME zone name produces a -05:00 offset for a timestamp in January and a -04:00 offset for a timestamp in July, because the underlying rules account for daylight saving time transitions.',
    },
    {
      thought: 'since the main page states AT TIME ZONE "handles DST automatically," that\'s a general property of any date/time arithmetic in SQL, including simple subtraction of a fixed number of hours.',
      reality: 'only named-zone conversions like AT TIME ZONE \'Eastern Standard Time\' or AT TIME ZONE \'America/New_York\' carry DST awareness — manually subtracting a hardcoded number of hours from a UTC timestamp has no DST logic at all and will be wrong for roughly half the year.',
    },
    {
      thought: 'DST transitions only matter for date/time display code, not for anything stored or computed in the database itself.',
      reality: 'any AT TIME ZONE conversion performed inside a query — for filtering, grouping, or reporting in local time — is subject to the exact same DST-dependent offset shift demonstrated above, since the conversion happens at query time based on each row\'s own timestamp.',
    },
  ];
}
