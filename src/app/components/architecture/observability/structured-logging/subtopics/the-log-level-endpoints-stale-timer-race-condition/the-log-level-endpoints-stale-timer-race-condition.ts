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
    heading: 'A Second Admin Call Doesn’t Cancel the First Call’s Timer',
    points: [
      'The main page’s own "Logging at DEBUG level in production" mistake block fixes the problem with an admin endpoint: <code>logger.level = req.body.level; setTimeout(() =&gt; { logger.level = &#39;info&#39;; }, 5 * 60 * 1000);</code> — set the level, and automatically revert it after 5 minutes. This works correctly for a single, isolated call.',
      'It breaks the moment the endpoint is called a SECOND time before the first call’s 5-minute timer has fired: each call schedules its own independent <code>setTimeout</code>, and nothing tracks or cancels the earlier one. If the first call set <code>debug</code> and the second call — moments later — sets a DIFFERENT level like <code>warn</code>, the FIRST call’s stale timer still fires on its own original schedule and silently reverts the level to <code>info</code>, overriding whatever the second admin actually intended.',
      'The fix is to track the currently-pending timer in a module-level variable and <code>clearTimeout()</code> it at the start of every new call, before scheduling a fresh one — the same pattern used anywhere a repeated action needs to supersede, not stack with, a previous pending one (a search-input debounce is the most common example of the identical pattern).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Race, Reproduced and Fixed',
    language: 'typescript',
    code: `// ── BROKEN: matches the main page's ORIGINAL fix code ────────────────
let brokenLevel = 'info';
function setLogLevelBroken(level: string, revertAfterMs: number) {
  brokenLevel = level;
  setTimeout(() => { brokenLevel = 'info'; }, revertAfterMs);
}

// Admin call #1 at t=0: set debug, auto-revert in 300ms (standing in for 5 min)
setLogLevelBroken('debug', 300);
console.log('t=0,   after call 1: level =', brokenLevel);

// Admin call #2 at t=80: sets warn, intending it to hold until t=380
setTimeout(() => {
  setLogLevelBroken('warn', 300);
  console.log('t=80,  after call 2: level =', brokenLevel);
}, 80);

// t=340: call 1's STALE timer (scheduled at t=0, fires at t=300) has
// already reverted the level -- even though call 2 wanted 'warn' to
// hold until t=380
setTimeout(() => {
  console.log('t=340, broken:      level =', brokenLevel, '<- WRONG, call 1\\'s stale timer overwrote it');
}, 340);

// ── FIXED: track and cancel the pending timer on every new call ──────
let fixedLevel = 'info';
let activeTimer: ReturnType<typeof setTimeout> | null = null;
function setLogLevelFixed(level: string, revertAfterMs: number) {
  if (activeTimer) clearTimeout(activeTimer); // cancel any earlier pending revert
  fixedLevel = level;
  activeTimer = setTimeout(() => { fixedLevel = 'info'; activeTimer = null; }, revertAfterMs);
}

setLogLevelFixed('debug', 300);
setTimeout(() => setLogLevelFixed('warn', 300), 80);
setTimeout(() => {
  console.log('t=340, fixed:       level =', fixedLevel, '<- correct, call 1\\'s timer was cancelled');
}, 340);
setTimeout(() => {
  console.log('t=450, fixed:       level =', fixedLevel, '<- call 2\\'s own timer has now fired');
}, 450);
// -> t=0,   after call 1: level = debug
// -> t=80,  after call 2: level = warn
// -> t=340, broken:      level = info  <- WRONG, call 1's stale timer overwrote it
// -> t=340, fixed:       level = warn  <- correct, call 1's timer was cancelled
// -> t=450, fixed:       level = info  <- call 2's own timer has now fired`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The fixed version cancels the PREVIOUS timer every time <code>setLogLevelFixed()</code> is called. If an admin calls it three times in quick succession — <code>debug</code>, then <code>warn</code>, then <code>error</code> — how many separate <code>setTimeout</code> callbacks actually end up FIRING (not counting ones that get cancelled before they run)?',
  hint: 'Trace through each call in order: does calling <code>setLogLevelFixed()</code> a second or third time cancel a timer that was ALREADY cancelled once before, or does it correctly find and cancel the most recent one?',
  solution: `// Exactly ONE timer fires -- the one scheduled by the THIRD (most
// recent) call.
//
// Call 1 (debug): activeTimer is null, so nothing to cancel. Schedules
// timer A, stores it in activeTimer.
//
// Call 2 (warn): activeTimer currently holds timer A -- clearTimeout(A)
// cancels it. Schedules timer B, stores it in activeTimer (overwriting
// the now-cancelled reference to A).
//
// Call 3 (error): activeTimer currently holds timer B -- clearTimeout(B)
// cancels it. Schedules timer C, stores it in activeTimer.
//
// Only timer C, from the THIRD call, ever actually fires and reverts
// the level to 'info' -- timers A and B are both cancelled before they
// get the chance. This is exactly the intended behavior: the level
// should revert 5 minutes after the LATEST admin action, not 5 minutes
// after every individual call that happened to occur along the way.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The bug in the original code only matters if two admins happen to call the endpoint at almost the exact same moment — a rare coincidence in practice.',
    reality: 'The bug triggers any time the SECOND call happens BEFORE the first call’s full 5-minute window has elapsed, which is a much wider window than "the exact same moment" — an admin extending an active debugging session by calling the endpoint again a minute in, or two different admins independently debugging the same incident within the same 5 minutes, both trigger it without needing any unlucky timing at all.',
  },
  {
    thought: 'Since the fix stores <code>activeTimer</code> in a plain module-level variable, this same fix would work correctly across multiple server instances behind a load balancer.',
    reality: 'A module-level variable is local to ONE running process — if the admin endpoint is called on instance A and then instance B, each instance has its own independent <code>activeTimer</code>/<code>fixedLevel</code> state with no coordination between them; instance A’s timer keeps running on its own schedule regardless of what happens on instance B. A truly cluster-wide dynamic log level needs shared state (a config service, a database flag polled by all instances) — this fix only solves the race WITHIN a single process.',
  },
  {
    thought: 'Calling <code>clearTimeout()</code> on a timer that has ALREADY fired (its callback already ran) would throw an error or otherwise cause a problem.',
    reality: 'Node’s <code>clearTimeout()</code> is safe to call on an already-fired (or already-cleared) timer reference — it silently does nothing in that case, no error thrown. This is actually why the fixed version also sets <code>activeTimer = null</code> INSIDE the timer’s own callback: it’s not strictly required for safety (a stale reference to an already-fired timer is harmless to clear again later), but it keeps <code>activeTimer</code> accurately reflecting "is there currently a PENDING revert," which matters if other code ever needs to check that state.',
  },
];

@Component({
  selector: 'app-obs-structured-logging-timer-race',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-log-level-endpoints-stale-timer-race-condition.html',
  styleUrl: './the-log-level-endpoints-stale-timer-race-condition.scss',
})
export class TheLogLevelEndpointsStaleTimerRaceConditionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
