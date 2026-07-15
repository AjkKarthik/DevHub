import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './recursive-nexttick-starves-io-forever.html',
  styleUrl: './recursive-nexttick-starves-io-forever.scss'
})
export class RecursiveNexttickStarvesIoForeverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states nextTick "runs before the next event loop phase" — the mechanism behind that statement has a genuine sharp edge',
      points: [
        'Node.js\'s own documentation is explicit about this: any time process.nextTick() is called during a given phase, ALL callbacks passed to it are resolved before the event loop is allowed to continue — and critically, this draining is not a one-time snapshot. If a nextTick callback itself calls process.nextTick() again, that NEW callback is added to the same queue being drained, and it too runs before the event loop proceeds.',
        'This is exactly why Node\'s docs call out recursive nextTick calls by name as a way to "starve" I/O — a callback that unconditionally schedules another process.nextTick() call every time it runs creates a queue that never empties, since new work keeps arriving faster than the queue can finish. The event loop is permanently stuck completing "the current operation" and never reaches the poll phase, timers, or setImmediate at all.',
      ]
    },
    {
      heading: 'Why this is a genuine hang, not just added latency',
      points: [
        'Unlike a slow synchronous computation (which eventually finishes and lets the loop continue), an unconditional recursive nextTick loop has no natural end — it is architecturally identical to an infinite loop, just implemented through the async callback queue instead of a while(true) statement. No incoming HTTP request, timer, or file read will ever get its callback invoked while this is happening, since the poll/timers/check phases are never reached.',
        'The fix Node\'s own docs recommend is using setImmediate() instead for cases that genuinely need to "yield" and reschedule work — setImmediate callbacks run in the check phase, AFTER the poll phase, meaning pending I/O gets a chance to be processed between each round of rescheduled work, rather than being starved indefinitely.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — an unconditional recursive nextTick hangs the process',
      language: 'typescript',
      code: `// A well-intentioned "keep checking a condition" loop, written
// with process.nextTick() instead of setImmediate()
let attempts = 0;

function pollUntilReady() {
  if (isReady()) {
    console.log('Ready after', attempts, 'attempts');
    return;
  }
  attempts++;
  process.nextTick(pollUntilReady); // BUG: schedules itself again
}

pollUntilReady();

// If isReady() never becomes true synchronously (e.g. it depends
// on an I/O callback setting a flag), this hangs forever — the
// nextTick queue is drained completely before EVERY phase, so the
// I/O event that would set the flag never gets a chance to run.
// The process appears completely frozen: no requests served, no
// timers fire, nothing.`,
    },
    {
      label: 'The fix — setImmediate() lets I/O run between iterations',
      language: 'typescript',
      code: `let attempts = 0;

function pollUntilReady() {
  if (isReady()) {
    console.log('Ready after', attempts, 'attempts');
    return;
  }
  attempts++;
  setImmediate(pollUntilReady); // runs in the check phase,
                                 // AFTER the poll phase each time
}

pollUntilReady();

// setImmediate schedules the next check phase — which happens
// AFTER poll, meaning any pending I/O callback (including the one
// that might set the flag isReady() checks) gets a chance to run
// on every single iteration, instead of never running at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a function that recursively calls process.nextTick() on itself to "wait" for an async flag to become true, set by an fs.readFile() callback elsewhere in the app. When they run this, the entire process appears to freeze — no HTTP requests are served, and even the file read that was supposed to set the flag never seems to complete. Using what you know about how the nextTick queue is drained, explain exactly why the file read itself never completes.',
    hint: 'Node\'s event loop drains the ENTIRE nextTick queue — including any new callbacks added while draining it — before moving to the next phase. Which phase does a completed fs.readFile() callback actually get delivered through?',
    solution: 'The fs.readFile() callback is delivered through the poll phase (fs operations run on the libuv thread pool, and their completion callbacks are queued for the poll phase once the underlying work finishes) — but the event loop can never REACH the poll phase in this scenario, because the nextTick queue is being drained completely, and completely, before every single phase transition. Since the recursive function unconditionally calls process.nextTick() on itself again every time it runs, it continuously adds new work to the SAME queue being drained — the queue never actually finishes, so the event loop never advances past "draining nextTick" to reach poll, timers, or check. This means the file read\'s completion callback, once the thread pool actually finishes reading the file, sits in the poll phase\'s queue indefinitely, waiting for a phase transition that never happens. The fix is switching the recursive scheduling to setImmediate() (check phase, which runs AFTER poll), which lets the event loop actually reach the poll phase between each rescheduled check.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'process.nextTick() and setImmediate() are interchangeable ways to "defer" a callback to run slightly later — the choice between them is mostly a matter of style.',
      reality: 'This subtopic\'s theory clarifies they have fundamentally different scheduling guarantees — nextTick drains completely (including newly-added callbacks) before ANY other phase runs, while setImmediate specifically runs AFTER the poll phase, making them behave very differently for recursive/self-scheduling patterns.'
    },
    {
      thought: 'A recursive process.nextTick() call that never terminates would eventually slow down the app or cause a stack overflow, but wouldn\'t completely freeze it — some I/O would still trickle through.',
      reality: 'This subtopic\'s exercise shows this is a genuine, total freeze — since the nextTick queue must drain COMPLETELY before any other phase runs, an unconditionally self-scheduling nextTick call prevents ANY I/O, timer, or setImmediate callback from ever running, not just slowing them down.'
    },
    {
      thought: 'This starvation risk only applies to obviously recursive code that calls itself by name — a more indirect chain of nextTick calls across different functions would behave differently.',
      reality: 'This subtopic\'s theory shows the mechanism cares only about whether NEW callbacks keep being added to the queue while it drains — it has no awareness of whether that\'s literally the same function calling itself or a chain of different functions each scheduling the next; any pattern that keeps adding nextTick work faster than it can drain produces the same starvation.'
    }
  ];
}
