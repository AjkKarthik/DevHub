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
    heading: 'The Gauge Alone Doesn’t Tell You "For How Long"',
    points: [
      'The main page’s own "Not monitoring database connection pool" mistake block builds a real <code>db_pool_connections</code> gauge exposing <code>active</code>/<code>idle</code>/<code>waiting</code> connection counts, and its explanation states the actual rule precisely: "alert when waiting count is non-zero for more than 30 seconds." The gauge itself only ever reports the CURRENT count at scrape time — nothing in the codeTab tracks how LONG that count has stayed above zero.',
      'This is the exact same pattern the main page’s FIRST mistake block already uses at the alert-rule level, via PromQL’s <code>for: 5m</code> clause ("suppresses transient bursts") — but that mechanism lives entirely in the Prometheus alerting layer, external to the application. The connection-pool gauge, being emitted from application code, has no equivalent built-in duration tracking of its own.',
      'A momentary blip — one request briefly waiting for a connection under a short, harmless burst — should not page anyone; a queue that STAYS non-empty for 30+ continuous seconds is a genuinely different, escalating situation. Distinguishing the two requires explicitly tracking WHEN the condition first became true, not just whether it’s true right now.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sustained-Condition Tracker, Verified',
    language: 'typescript',
    code: `class SustainedConditionTracker {
  private conditionStartedAt: number | null = null;

  /** Returns true only once isConditionTrue has held continuously for
   *  at least sustainedForMs. Resets the moment the condition clears. */
  check(isConditionTrue: boolean, nowMs: number, sustainedForMs: number): boolean {
    if (!isConditionTrue) {
      this.conditionStartedAt = null;
      return false;
    }
    if (this.conditionStartedAt === null) {
      this.conditionStartedAt = nowMs;
    }
    return (nowMs - this.conditionStartedAt) >= sustainedForMs;
  }
}

const SUSTAINED_MS = 30_000; // the main page's own "> 30 seconds" rule

// ── Scenario A: waiting count flickers to 1 for 5s then clears -- NO alert ──
const trackerA = new SustainedConditionTracker();
console.log('t=0,    waiting=1:', trackerA.check(true, 0, SUSTAINED_MS));      // false
console.log('t=5000, waiting=1:', trackerA.check(true, 5000, SUSTAINED_MS));   // false
console.log('t=6000, waiting=0:', trackerA.check(false, 6000, SUSTAINED_MS));  // false, cleared

// ── Scenario B: waiting count stays > 0 continuously for 35s -- alerts at 30s ──
const trackerB = new SustainedConditionTracker();
const start = 100_000;
console.log('t=+0s,  waiting=1:', trackerB.check(true, start, SUSTAINED_MS));           // false
console.log('t=+29s, waiting=1:', trackerB.check(true, start + 29_000, SUSTAINED_MS));  // false
console.log('t=+30s, waiting=1:', trackerB.check(true, start + 30_000, SUSTAINED_MS));  // true!
console.log('t=+35s, waiting=1:', trackerB.check(true, start + 35_000, SUSTAINED_MS));  // true, still sustained
// -> t=0,    waiting=1: false
// -> t=5000, waiting=1: false
// -> t=6000, waiting=0: false
// -> t=+0s,  waiting=1: false
// -> t=+29s, waiting=1: false
// -> t=+30s, waiting=1: true
// -> t=+35s, waiting=1: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'In Scenario B, the waiting count momentarily drops to 0 for exactly ONE tick at <code>t=+15s</code> (a connection freed up briefly), then goes back to 1 for the rest of the sequence through <code>t=+35s</code>. Does <code>trackerB</code> still fire at the <code>t=+30s</code> mark?',
  hint: 'Look at what the very first branch of <code>check()</code> does the instant <code>isConditionTrue</code> is <code>false</code>, even just once.',
  solution: `// No -- it does NOT fire at t=+30s anymore.
//
// The moment isConditionTrue is false, even for a single call,
// conditionStartedAt resets to null:
//
//   if (!isConditionTrue) {
//     this.conditionStartedAt = null;
//     return false;
//   }
//
// So the t=+15s "waiting=0" call resets the clock entirely. When
// waiting=1 resumes at t=+16s, the tracker treats that as a BRAND NEW
// start of the condition -- conditionStartedAt becomes 16000, not the
// original 0. The 30-second sustained window has to restart from
// scratch, so the tracker wouldn't actually fire until roughly
// t=+46s (16s + 30s), not t=+30s.
//
// This is the correct, intentional behavior: "sustained for 30 seconds"
// means CONTINUOUSLY true for 30 seconds, not "true for a cumulative 30
// seconds with gaps allowed" -- a queue that keeps draining and
// refilling is a meaningfully different (less severe) situation than
// one that never drains at all, even if the total time spent non-empty
// across both scenarios happens to be similar.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This sustained-condition logic duplicates what the PromQL <code>for: 5m</code> clause (used in the page’s own first alert rule) already does — building it in application code is redundant.',
    reality: 'They solve the same PROBLEM at two DIFFERENT layers, and both have a real role: <code>for: 5m</code> works on data Prometheus has already scraped and stored as a time series, entirely outside the application — it needs no application code changes at all, but can only react on Prometheus’s own scrape/evaluation cadence. A tracker like this one, running inside the application itself, can make a real-time decision (like proactively rejecting new work, or logging a structured warning) the moment a threshold is crossed, without waiting for the next scrape-and-evaluate cycle.',
  },
  {
    thought: 'A simpler fix would be to just increase the gauge\'s scrape interval so Prometheus samples it less often — that would naturally smooth out momentary blips without needing this extra tracking logic.',
    reality: 'A longer scrape interval doesn’t distinguish "sustained" from "momentary" at all — it just means Prometheus is more likely to randomly SAMPLE a value during whatever state happens to be true at that instant, which could just as easily catch a brief blip as miss a genuinely sustained problem. It trades one kind of unreliability for another rather than actually measuring duration.',
  },
  {
    thought: 'Since <code>conditionStartedAt</code> is a single field on the tracker instance, one <code>SustainedConditionTracker</code> could be reused to track BOTH the connection pool’s waiting count AND, say, CPU saturation, by calling <code>check()</code> with different booleans for each.',
    reality: 'A single tracker instance can only ever track ONE condition’s start time at once — calling <code>check()</code> for CPU saturation would silently overwrite (or incorrectly extend) the timer that was tracking the connection pool’s waiting count, since both would share the same <code>conditionStartedAt</code> field. Each independently-tracked condition needs its own separate tracker instance.',
  },
];

@Component({
  selector: 'app-obs-infra-metrics-sustained-condition',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tracking-a-sustained-condition-before-alerting.html',
  styleUrl: './tracking-a-sustained-condition-before-alerting.scss',
})
export class TrackingASustainedConditionBeforeAlertingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
