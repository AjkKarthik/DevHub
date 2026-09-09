import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-current-eviction-exceeded-time-and-other-info-fields',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './current-eviction-exceeded-time-and-other-info-fields.html',
  styleUrl: './current-eviction-exceeded-time-and-other-info-fields.scss',
})
export class CurrentEvictionExceededTimeAndOtherInfoFieldsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A snapshot check can\'t distinguish "just started" from "been bad for hours"',
      points: [
        'The main page\'s own Challenge, <code>checkMemoryPressure</code>, only ever inspects a single instant: <code>usedPct > 80</code>. Two servers can both report exactly 85% usage — one that tipped over the 80% line ten seconds ago, and another that has been stuck above it for the last three hours — and this function reports them identically.',
        'Verified directly against Redis\'s own official INFO documentation: <code>current_eviction_exceeded_time</code> (stats section) reports "the time passed since used_memory last rose above maxmemory, in MILLISECONDS" — not seconds, and it exists specifically to answer the question a bare usedPct snapshot cannot.',
        'A companion field, <code>total_eviction_exceeded_time</code>, tracks the CUMULATIVE total time (also in milliseconds) the server has spent over maxmemory across its entire uptime — distinct from the CURRENT streak <code>current_eviction_exceeded_time</code> reports. One answers "how long right now"; the other answers "how often has this happened, ever."',
      ],
    },
    {
      heading: 'Why the distinction is operationally useful, not just informational',
      points: [
        'A server that JUST tipped over budget is often self-correcting — the configured eviction policy is actively working, and usage may drop back below the line within seconds as writes trigger evictions. A server that has been over budget for a long, uninterrupted streak suggests the configured maxmemory is genuinely too small for the current working set, not a transient spike.',
        'A monitoring alert built only on <code>usedPct > 80</code> would fire — and potentially page someone — for both cases identically, even though only one of them represents a real, ongoing capacity problem worth acting on.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Extending checkMemoryPressure with real duration',
      language: 'typescript',
      code: `import Redis from 'ioredis';

function parseInfo(raw: string): Record<string, string> {
  return Object.fromEntries(
    raw.split('\\r\\n').filter(l => l.includes(':')).map(l => l.split(':')),
  );
}

async function diagnoseMemoryPressure(redis: Redis) {
  const [memory, stats] = await Promise.all([redis.info('memory'), redis.info('stats')]);
  const mem = parseInfo(memory);
  const st = parseInfo(stats);

  const used = parseInt(mem['used_memory'], 10);
  const max = parseInt(mem['maxmemory'] ?? '0', 10);
  const usedPct = max > 0 ? Math.round((used / max) * 100) : 0;

  // Both fields are reported in MILLISECONDS, per Redis's own INFO docs.
  const currentExceededMs = parseInt(st['current_eviction_exceeded_time'] ?? '0', 10);
  const totalExceededMs = parseInt(st['total_eviction_exceeded_time'] ?? '0', 10);

  let severity: 'healthy' | 'just-tipped-over' | 'recent-pressure' | 'sustained-pressure' = 'healthy';
  if (usedPct > 80 && currentExceededMs === 0) severity = 'just-tipped-over';
  else if (usedPct > 80 && currentExceededMs > 5 * 60 * 1000) severity = 'sustained-pressure';
  else if (usedPct > 80) severity = 'recent-pressure';

  return {
    usedPct,
    currentExceededSec: Math.round(currentExceededMs / 1000),
    totalExceededMinutesLifetime: Math.round(totalExceededMs / 60_000),
    severity,
  };
}

// Scenario A: usedPct is 85%, but current_eviction_exceeded_time is 0 -- just tipped over.
// Scenario B: usedPct is 85%, current_eviction_exceeded_time is 20 minutes -- sustained.
// Both scenarios would report identically under the main page's own bare usedPct check.
console.log({ usedPct: 85, currentExceededSec: 0, severity: 'just-tipped-over' });
console.log({ usedPct: 85, currentExceededSec: 1200, totalExceededMinutesLifetime: 180, severity: 'sustained-pressure' });`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A server reports <code>usedPct: 82</code>, <code>current_eviction_exceeded_time: 0</code>, and <code>total_eviction_exceeded_time</code> equal to 4 hours out of 30 days of uptime. Is this server currently in the "sustained-pressure" state, and does the 4-hour lifetime total on its own tell you whether today\'s tip-over is part of a recurring pattern?',
    hint: 'Distinguish the CURRENT streak (what decides today\'s severity label) from the LIFETIME total (a completely separate counter that resets only on restart).',
    solution: `No, it is not currently in "sustained-pressure" -- current_eviction_exceeded_time is 0, meaning THIS particular tip-over just happened moments ago, regardless of what the lifetime total says. The severity classification above only ever looks at the CURRENT streak.

The 4-hour lifetime total, on its own, does NOT tell you whether today's tip-over is part of a recurring pattern -- it could be one single 4-hour incident weeks ago, or it could be 240 separate one-minute blips spread evenly across 30 days. Distinguishing "one bad incident" from "chronically borderline" requires sampling total_eviction_exceeded_time repeatedly over time and watching how fast it climbs, not reading it once as a single number -- the same limitation the main page's own QnA already notes for the plain evicted_keys counter ("monitor over time," not as a one-off read).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"current_eviction_exceeded_time and total_eviction_exceeded_time are the same field under two names — one is probably just an alias."',
      reality: 'They track genuinely different things, both confirmed via Redis\'s own INFO docs: current_eviction_exceeded_time resets to 0 the moment usage drops back below maxmemory, while total_eviction_exceeded_time keeps accumulating across the server\'s entire uptime and never resets except on restart.',
    },
    {
      thought: '"Since the field name says \'time,\' it must be reported in seconds, matching most other duration-like Redis config values."',
      reality: 'Verified directly against the official docs: both fields report their value in MILLISECONDS, not seconds — a naive display of the raw number without dividing by 1000 would overstate the duration by 1000x.',
    },
  ];

  topicLabel = 'Eviction Policies';
  topicRoute = '/redis/eviction-policies';
  prev: SubtopicLink | null = {
    label: 'The LFU Morris Counter, Verified Against Real Redis Source',
    route: '/redis/eviction-policies/the-lfu-morris-counter-formula-verified',
  };
  next: SubtopicLink | null = null;
}
