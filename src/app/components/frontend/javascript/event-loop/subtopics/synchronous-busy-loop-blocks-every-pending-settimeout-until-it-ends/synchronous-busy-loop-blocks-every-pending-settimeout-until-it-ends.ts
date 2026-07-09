import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-busy-loop-blocks-settimeout-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './synchronous-busy-loop-blocks-every-pending-settimeout-until-it-ends.html',
  styleUrl: './synchronous-busy-loop-blocks-every-pending-settimeout-until-it-ends.scss',
})
export class SynchronousBusyLoopBlocksEveryPendingSetTimeoutUntilItEndsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2 and Call Stack QnA, Combined Into One Measurable Demo',
      points: [
        'The main page\'s "Long synchronous loops blocking the UI" mistake states that a busy-loop leaves the "UI completely frozen." Its call-stack QnA adds the mechanism: "the event loop only picks up the next task ... when the call stack is empty. A synchronous infinite loop ... fills the stack and prevents the event loop from ever running queued tasks."',
        'This subtopic makes that concrete with real elapsed-time logging: several <code>setTimeout</code> calls are scheduled to fire every 200ms, then a genuinely blocking synchronous loop runs for 2 full seconds. Every single one of those scheduled timers is measurably late — not by a few milliseconds, but by however long the busy-loop was still running when they were due.',
      ],
    },
    {
      heading: 'Why "Scheduled at 200ms" Is Really "Not Before 200ms"',
      points: [
        'A <code>setTimeout(fn, ms)</code> delay is always a MINIMUM, never a guarantee — the callback is only placed in the macrotask queue once <code>ms</code> milliseconds have elapsed, but it can only actually RUN once the call stack is empty AND the entire microtask queue is drained.',
        'A busy-loop keeps a frame permanently on the call stack for its whole duration — so every timer that becomes "ready" during that window simply queues up and waits, then fires in a rapid burst the instant the loop finally returns and the stack empties.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Busy-loop blocks pending setTimeout calls</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const startTime = performance.now();
function elapsed(): string {
  return (performance.now() - startTime).toFixed(0) + 'ms';
}

console.log('t=0ms: scheduling 5 timers, one every 200ms (should fire at ~200, 400, 600, 800, 1000ms)...');
for (let i = 1; i <= 5; i++) {
  setTimeout(() => {
    console.log('t=' + elapsed() + ': timer #' + i + ' fired (was due at ~' + (i * 200) + 'ms)');
  }, i * 200);
}

console.log('t=' + elapsed() + ': starting a SYNCHRONOUS busy-loop for 2000ms -- nothing else can run during this window...');

function blockFor(ms: number) {
  const start = performance.now();
  while (performance.now() - start < ms) {
    // busy-wait: this keeps a frame on the call stack the entire time
  }
}
blockFor(2000);

console.log('t=' + elapsed() + ': busy-loop finished -- watch how many of the 5 timers fire immediately, in a burst, right after this line');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'All 5 timers were scheduled to fire between 200ms and 1000ms. The busy-loop runs synchronously for a full 2000ms. At what timestamp do the timers actually fire?',
    hint: 'A timer\'s delay only controls when it becomes ELIGIBLE to run — it still needs the call stack to be empty before its callback can actually execute.',
    solution: `All 5 timers fire in a rapid burst immediately AFTER the busy-loop
finishes, at roughly t=2000ms -- not at their originally scheduled
200/400/600/800/1000ms marks.

Here's why: setTimeout(fn, ms) guarantees fn won't run BEFORE ms
milliseconds have passed, but it makes no promise about running
exactly at that time. The busy-loop keeps a single function frame
on the call stack for the full 2000ms. Even though every timer
becomes "ready" (its delay has elapsed) well before the loop
finishes, the event loop cannot hand control to any of their
callbacks until the call stack is completely empty again.

Once blockFor(2000) finally returns, the stack empties, and the
event loop immediately processes all 5 now-overdue timers back to
back in the order they were originally scheduled -- which is why
you see all 5 "timer fired" logs appear at nearly the same
timestamp, right at the ~2000ms mark, instead of spread out over
the first second like their delays would suggest.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setTimeout(fn, 200) guarantees fn runs at approximately the 200ms mark, give or take a small margin of error.',
      reality: 'the delay passed to setTimeout is only a MINIMUM wait time, never a guarantee — the callback can be delayed indefinitely if the call stack is kept busy (by a busy-loop, a huge synchronous computation, or anything else) past that point.',
    },
    {
      thought: 'a synchronous busy-loop only blocks OTHER JavaScript code from running — timers, network callbacks, and the browser\'s own rendering pipeline are independent systems that keep working in the background.',
      reality: 'a busy-loop blocks literally everything that needs the call stack to be empty to proceed — timers, promise callbacks, click/scroll/keyboard events, AND the browser\'s rendering (painting a new frame) all wait for the exact same call stack to clear.',
    },
    {
      thought: 'if multiple timers become overdue while the call stack is busy, only the most recently scheduled one actually fires once the stack clears — the others get silently dropped since they missed their window.',
      reality: 'none of the overdue timers are dropped — every single one that became eligible while the stack was busy still fires, all of them in a rapid burst back to back, in the order they were originally scheduled, the instant the stack finally empties.',
    },
  ];
}
