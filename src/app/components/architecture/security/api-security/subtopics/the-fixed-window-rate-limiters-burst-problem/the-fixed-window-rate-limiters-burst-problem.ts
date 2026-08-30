import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Flaw Named, Never Demonstrated — Including in the Main Page\'s Own Choice of Library',
    points: [
      'The theory names the exact flaw: "Fixed window: N requests per minute. Simple but has burst problem at window boundary (2N requests in 2 seconds)." The main page\'s own "Rate Limiting + BOLA Prevention" codeTab configures <code>express-rate-limit</code> with a <code>windowMs</code>/<code>max</code> pair — the library\'s default algorithm is a fixed window, meaning the main page\'s own worked example is actually subject to the exact flaw its own theory describes one paragraph away, without ever connecting the two.',
      'This subtopic makes the connection explicit: a direct simulation of the burst, verified numerically before being written up, followed by the sliding-window-log fix the theory names as the more accurate (if more memory-heavy) alternative.',
    ],
  },
  {
    heading: 'Why the Burst Happens at Exactly the Window Boundary',
    points: [
      'A fixed window resets its counter completely at fixed clock boundaries (e.g. the top of every minute) — the counter has no memory of anything from the PREVIOUS window at all. If a client sends its full allotment of <code>N</code> requests in the very last moments of window 1, then immediately sends another full <code>N</code> requests in the very first moments of window 2, BOTH windows individually stayed within their own limit — the limiter has no way to see the two bursts as related, because from its point of view they are two completely separate accounting periods.',
      'The result is <code>2N</code> requests accepted within a span that can be measured in single-digit milliseconds, even though the STATED limit was <code>N</code> per minute — a real gap between what the configuration promises and what a client positioned at the boundary can actually achieve.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Burst, Simulated',
    language: 'typescript',
    code: `const WINDOW_MS = 60_000;   // matches the main page's own 1-minute window
const LIMIT = 5;             // matches the main page's own authLimiter max: 5

function windowKey(t: number): number {
  return Math.floor(t / WINDOW_MS);
}

function simulateFixedWindow(requestTimes: number[]): number {
  const counts: Record<number, number> = {};
  let accepted = 0;
  for (const t of requestTimes) {
    const key = windowKey(t);
    counts[key] = (counts[key] ?? 0) + 1;
    if (counts[key] <= LIMIT) accepted++;
  }
  return accepted;
}

// 5 requests at the very END of window 0, 5 more at the very START
// of window 1 -- a span of only 10 milliseconds total.
const requestTimes = [
  59995, 59996, 59997, 59998, 59999,   // window 0 -- exactly at the limit
  60001, 60002, 60003, 60004, 60005,   // window 1 -- exactly at the limit again
];

console.log('Requests sent:', requestTimes.length);
console.log('Accepted:', simulateFixedWindow(requestTimes));
console.log('Span (ms):', requestTimes[requestTimes.length - 1] - requestTimes[0]);
// -> Requests sent: 10, Accepted: 10, Span (ms): 10
// The STATED limit is 5 per minute -- but all 10 requests, double the
// limit, were accepted within a 10-millisecond span.`,
  },
  {
    label: 'The Fix — Sliding Window Log',
    language: 'typescript',
    code: `// The theory's own alternative: "track each request timestamp; count
// requests in the past N seconds. Accurate but memory-heavy."
class SlidingWindowLimiter {
  private timestamps: number[] = [];
  constructor(private windowMs: number, private limit: number) {}

  tryRequest(now: number): boolean {
    // Drop any timestamp outside the CURRENT rolling window --
    // "the past windowMs", measured backward from THIS request, not
    // from any fixed clock boundary at all.
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

    if (this.timestamps.length >= this.limit) return false;

    this.timestamps.push(now);
    return true;
  }
}

const limiter = new SlidingWindowLimiter(WINDOW_MS, LIMIT);
let accepted = 0;
for (const t of requestTimes) {
  if (limiter.tryRequest(t)) accepted++;
}
console.log('Sliding window accepted:', accepted);
// -> 5, not 10 -- because at t=60001, the window "past 60,000ms" still
// includes the 5 requests from 59995-59999 (they're only 6-11ms old,
// nowhere close to expiring), so the limiter correctly sees 5 already-
// counted requests and rejects the second burst entirely.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Using the SAME <code>SlidingWindowLimiter</code>, what is the EARLIEST timestamp (relative to the first burst\'s <code>59995</code>) at which a client could successfully send a NEW request, after the first 5-request burst has been accepted and rejected as shown above?',
  hint: 'The <code>filter()</code> call drops timestamps where <code>now - t >= windowMs</code> — work out the exact moment the OLDEST of the 5 accepted timestamps (59995) finally ages out of a 60,000ms window.',
  solution: `// The earliest successful new request is at t=119995 -- exactly
// 60,000ms (one full WINDOW_MS) after the OLDEST accepted timestamp,
// 59995.

// The filter condition keeps a timestamp t only while now - t <
// windowMs. For the oldest timestamp (59995) to finally be dropped,
// we need now - 59995 >= 60000, i.e. now >= 119995. At exactly
// now = 119995, timestamps.length after filtering drops to 4 (only
// 59995 ages out; 59996-59999 are still within the window by a few
// milliseconds), which is BELOW the limit of 5 -- so a new request at
// t=119995 is accepted.

// This is the real behavioral difference the fix provides: rather
// than a hard reset at a fixed clock boundary (fixed window), the
// sliding window limiter continuously "rolls forward" -- each
// individual request's own timestamp ages out independently, exactly
// 60 seconds after IT was made, rather than all 5 requests suddenly
// becoming "free" again the instant a new fixed-clock minute begins.
// This is precisely what closes the boundary-burst gap: there is no
// single moment where the counter resets to zero for everyone at once.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page\'s own rate limiting codeTab, using express-rate-limit with windowMs/max, is already safe from the burst problem the theory describes, since it\'s a well-established, widely-used library.',
    reality: 'The theory\'s own description of the fixed-window flaw applies to EXACTLY the configuration shape the main page uses — <code>windowMs</code>/<code>max</code> is the fixed-window algorithm by definition, and this is <code>express-rate-limit</code>\'s own default algorithm unless a different store/strategy is explicitly configured. Using a popular, well-maintained library does not change which ALGORITHM it implements by default — the burst problem is a property of the fixed-window approach itself, not a bug in any specific library\'s implementation of it.',
  },
  {
    thought: 'Since the sliding window log fixes the burst problem, it should always be preferred over fixed windows — there\'s no real reason to ever use a fixed window.',
    reality: 'The theory itself already names the real tradeoff: "Accurate but memory-heavy." A fixed window needs only ONE counter per client per window — a single integer. A sliding window log needs to store and prune a TIMESTAMP PER REQUEST for every client, which scales with total request volume, not just client count — for a very high-traffic API, this can be a genuinely significant memory cost. The main page\'s own theory names a third option, token bucket, specifically as a middle ground ("allows controlled bursting") — the right choice depends on how much precision the specific endpoint actually needs versus what memory overhead is acceptable.',
  },
];

@Component({
  selector: 'app-sec-api-burst',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-fixed-window-rate-limiters-burst-problem.html',
  styleUrl: './the-fixed-window-rate-limiters-burst-problem.scss',
})
export class TheFixedWindowRateLimitersBurstProblemSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
