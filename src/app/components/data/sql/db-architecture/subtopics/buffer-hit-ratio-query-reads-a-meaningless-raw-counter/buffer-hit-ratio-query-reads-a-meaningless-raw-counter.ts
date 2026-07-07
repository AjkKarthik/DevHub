import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-buffer-hit-ratio-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './buffer-hit-ratio-query-reads-a-meaningless-raw-counter.html',
  styleUrl: './buffer-hit-ratio-query-reads-a-meaningless-raw-counter.scss',
})
export class BufferHitRatioQueryReadsAMeaninglessRawCounterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Buffer Hit Ratio Query Reads a Meaningless Raw Number',
      points: [
        'sys.dm_os_performance_counters stores certain metrics as RATIO-type counters, which are NOT usable on their own — "Buffer cache hit ratio" is one of these. Its raw cntr_value is NOT a percentage; it is the accumulated NUMERATOR of a ratio whose DENOMINATOR lives in a separate, paired row: "Buffer cache hit ratio base". The correct calculation divides the two paired counters together. The main page\'s own MSSQL code tab selects ONLY the "Buffer cache hit ratio" row and labels its raw cntr_value directly as HitRatio, without ever joining or dividing by the base counter — the number that query returns is not a percentage at all, and is essentially meaningless read alone.',
        'This is a well-documented category of SQL Server performance counter: a "fraction" counter must be divided by its paired "base" counter to produce a usable ratio. Reading the fraction counter alone — exactly what the main page\'s own query does — produces a raw accumulated count with no inherent scale, easy to mistake for an already-computed percentage since its typical magnitude can coincidentally look plausible.',
      ],
    },
    {
      heading: 'Both Counters Are Also Cumulative Since Server Start — Not a Live Rate',
      points: [
        'Even the CORRECTLY computed ratio (after dividing by the base counter) is accumulated since the SQL Server service last started, not a recent or live figure. On a server that has been running for months, a single bad batch job today that causes millions of physical reads barely moves the cumulative ratio, since it\'s averaged against potentially billions of historical hits accumulated over the server\'s entire uptime. A genuinely LIVE hit ratio requires sampling the counter TWICE with a time interval between reads and computing the DELTA over that specific window — exactly how tools like Perfmon compute a "current" rate from a cumulative counter.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own query vs the correct calculation',
      language: 'sql',
      code: `-- The main page's own query — reads the raw fraction counter alone:
SELECT object_name, counter_name, cntr_value AS HitRatio
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name = 'Buffer cache hit ratio';
-- cntr_value here is NOT a percentage — it's an accumulated numerator
-- with no inherent scale. Treating it as "the hit ratio" is meaningless.

-- CORRECT: divide by the paired base counter
SELECT
    ratio.cntr_value * 1.0 / NULLIF(base.cntr_value, 0) * 100 AS BufferCacheHitRatioPct
FROM sys.dm_os_performance_counters ratio
JOIN sys.dm_os_performance_counters base
    ON base.object_name  = ratio.object_name
   AND base.counter_name = 'Buffer cache hit ratio base'
WHERE ratio.object_name  LIKE '%Buffer Manager%'
  AND ratio.counter_name = 'Buffer cache hit ratio';`,
    },
    {
      label: 'Computing a genuinely LIVE ratio via two samples',
      language: 'sql',
      code: `-- Sample 1: capture both counters now
DECLARE @Hit1 BIGINT, @Base1 BIGINT;
SELECT @Hit1  = cntr_value FROM sys.dm_os_performance_counters
WHERE counter_name = 'Buffer cache hit ratio'      AND object_name LIKE '%Buffer Manager%';
SELECT @Base1 = cntr_value FROM sys.dm_os_performance_counters
WHERE counter_name = 'Buffer cache hit ratio base' AND object_name LIKE '%Buffer Manager%';

WAITFOR DELAY '00:01:00';   -- observation window

-- Sample 2: capture both counters again
DECLARE @Hit2 BIGINT, @Base2 BIGINT;
SELECT @Hit2  = cntr_value FROM sys.dm_os_performance_counters
WHERE counter_name = 'Buffer cache hit ratio'      AND object_name LIKE '%Buffer Manager%';
SELECT @Base2 = cntr_value FROM sys.dm_os_performance_counters
WHERE counter_name = 'Buffer cache hit ratio base' AND object_name LIKE '%Buffer Manager%';

-- The DELTA over this window is the actual RECENT hit ratio —
-- immune to being smoothed out by months of historical accumulation.
SELECT (@Hit2 - @Hit1) * 1.0 / NULLIF(@Base2 - @Base1, 0) * 100 AS RecentHitRatioPct;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA runs the main page\'s own original query during a known bad-performance incident and sees cntr_value = 47,382,910,551 for "Buffer cache hit ratio" — a huge number, clearly not a percentage — and correctly realizes the query is wrong. They fix it by joining the base counter as shown above, getting 98.7%. But the incident ticket says users are experiencing severe slowness RIGHT NOW. Why might 98.7% still not tell them what they need to know?',
    hint: 'Think about how long the SQL Server service has been running, and how a huge historical denominator affects how much a RECENT problem can move the ratio.',
    solution: `Even the correctly-computed 98.7% is a CUMULATIVE figure covering the
server's entire uptime since last restart — if the server has been
running for, say, 200 days, that 98.7% is averaged against potentially
trillions of historical buffer accesses. A severe RECENT regression —
even one causing near-100% physical reads for the last 10 minutes —
would barely dent a ratio computed over 200 days of mostly-healthy
history. 98.7% overall can coexist with a genuinely terrible LAST-HOUR
hit ratio.

To actually diagnose a RIGHT NOW incident, the DBA needs the two-sample
delta technique from the second code tab: capture both the ratio and
base counters, wait a short observation window (matching how recent the
reported slowness is — a few minutes is often enough), sample again,
and compute the DELTA's ratio. That delta reflects ONLY what happened
during the observation window, correctly isolating the recent problem
from months of accumulated healthy history that the single cumulative
snapshot can't distinguish from.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'querying sys.dm_os_performance_counters for "Buffer cache hit ratio" and reading its cntr_value directly gives you the buffer cache hit percentage, exactly as the main page\'s own code tab does.',
      reality: '"Buffer cache hit ratio" is a RATIO-type counter whose raw cntr_value is only the numerator — it must be divided by the paired "Buffer cache hit ratio base" counter to produce an actual percentage. Reading it alone returns a meaningless accumulated number.',
    },
    {
      thought: 'a correctly-computed buffer cache hit ratio (after joining the base counter) tells you how the buffer pool is performing RIGHT NOW.',
      reality: 'the ratio is cumulative since SQL Server last started — on a long-uptime server, it can take a severe, ongoing regression a very long time to noticeably move a ratio averaged over months of prior healthy activity.',
    },
    {
      thought: 'diagnosing a live performance incident just requires querying the current value of a performance counter.',
      reality: 'for cumulative counters, diagnosing a RECENT change requires sampling the counter TWICE with a time gap and computing the DELTA over that specific window — a single snapshot reading, no matter how carefully computed, cannot isolate recent behavior from long-term history.',
    },
  ];
}
