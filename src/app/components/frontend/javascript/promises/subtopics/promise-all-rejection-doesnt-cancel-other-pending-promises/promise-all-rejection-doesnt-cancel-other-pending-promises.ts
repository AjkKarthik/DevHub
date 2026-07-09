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
  selector: 'app-promise-all-doesnt-cancel-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './promise-all-rejection-doesnt-cancel-other-pending-promises.html',
  styleUrl: './promise-all-rejection-doesnt-cancel-other-pending-promises.scss',
})
export class PromiseAllRejectionDoesntCancelOtherPendingPromisesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Calls This "a Common Misconception" — This Makes the Background Work Directly Observable',
      points: [
        'The QnA section states plainly: "JavaScript promises have no cancellation mechanism built in... the other promises keep running to completion... any side effects they were performing... still happen." This is a genuinely surprising claim about background behavior that continues AFTER your code has already moved on — but nothing in the main page actually shows a side effect firing after the catch block already ran.',
        'This subtopic builds three "requests" with different delays, where one rejects quickly and the others have real, logged side effects when they eventually finish — then watches whether those side-effect logs appear AFTER the <code>Promise.all</code> rejection has already been caught and handled.',
      ],
    },
    {
      heading: 'Why "No Cancellation" Is a Fundamental Property of Promises, Not Just Promise.all',
      points: [
        'A Promise, once created, represents a computation that is ALREADY IN PROGRESS (or about to be) — <code>Promise.all</code> is just an OBSERVER that subscribes to multiple existing promises and waits for all of them, or fails fast on the first rejection. It has no power to reach into an unrelated promise and stop the underlying work (a <code>setTimeout</code>, a real network request, a file read) that produces that promise\'s eventual value.',
        'When <code>Promise.all</code> "rejects immediately" on the first failure, all that means is: the <code>Promise.all</code> promise ITSELF settles into the rejected state right away, so any code awaiting IT (your <code>catch</code> block, or code after the <code>await</code>) resumes immediately. The other promises are completely unaware this happened — they have no reference back to the <code>Promise.all</code> call, and continue running exactly as if <code>Promise.all</code> had never rejected at all.',
        'Genuinely cancelling in-flight work (a network request, a timer) requires an explicit mechanism designed for that purpose — <code>AbortController</code> for fetch, or manually clearing a <code>setTimeout</code>\'s ID — Promise.all rejecting is never sufficient on its own.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Promise.all cancellation demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function slowSucceedingTask(label: string, ms: number) {
  await delay(ms);
  console.log('  [SIDE EFFECT] ' + label + ' finished and did its work, at t=' + ms + 'ms');
  return label;
}

async function fastFailingTask(ms: number) {
  await delay(ms);
  throw new Error('fastFailingTask rejected at t=' + ms + 'ms');
}

async function main() {
  console.log('Starting Promise.all with 3 tasks (one fails fast, two succeed slowly)...');

  try {
    await Promise.all([
      slowSucceedingTask('Task A', 150),
      fastFailingTask(20),
      slowSucceedingTask('Task B', 100),
    ]);
  } catch (err) {
    console.log('CAUGHT the rejection at approximately t=20ms:', (err as Error).message);
  }

  console.log('catch block finished -- but are Task A and Task B REALLY done yet?');
  console.log('(Watch for their [SIDE EFFECT] logs appearing AFTER this line, later in real time.)');
}

main();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Note the timestamp when the rejection is caught. Do the "[SIDE EFFECT]" logs for Task A and Task B appear before or after that catch message?',
    hint: 'Task A and Task B were never told to stop — ask whether their own setTimeout delays are still counting down in the background, independent of what Promise.all decided to do.',
    solution: `The catch block's message ("CAUGHT the rejection at approximately
t=20ms") appears almost immediately -- Promise.all rejected as soon
as fastFailingTask's error occurred, at roughly 20ms.

The "catch block finished" message and the note about watching for
side effects appear right after, still very early.

Then, LATER -- at approximately 100ms and 150ms respectively -- the
"[SIDE EFFECT] Task B finished..." and "[SIDE EFFECT] Task A
finished..." messages appear, well AFTER the catch block already ran
and the main() function's own visible work was done.

This directly confirms the QnA's claim: Task A and Task B were never
cancelled. Their own setTimeout delays kept counting down completely
independently of what Promise.all decided to do with its own
rejection -- Promise.all catching the fast failure had zero effect
on the two slower tasks' actual execution. If those tasks had real
side effects (a database write, a state mutation, a second network
call), those side effects still happened, in full, even though the
code that originally awaited them had already moved on to handling
the earlier error.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Promise.all rejecting on the first failure automatically cancels or aborts the other pending promises in the array, since they\'re no longer needed.',
      reality: 'JavaScript promises have no built-in cancellation mechanism at all — the other promises have no awareness that Promise.all rejected, and continue running to completion (or their own eventual rejection) exactly as if nothing happened.',
    },
    {
      thought: 'once a catch block for a Promise.all call has run, any real-world side effects (network requests, timers, file writes) from the other promises in that array are guaranteed to have also stopped.',
      reality: 'any side effects the other promises were performing continue completely unaffected — the catch block running only reflects that the Promise.all promise itself settled, not that the underlying async work anywhere else was stopped.',
    },
    {
      thought: 'this "no cancellation" behavior is specific to Promise.all — a plain await on a single promise, or Promise.race, would behave differently and actually stop the underlying work.',
      reality: 'this is a fundamental property of ALL promises and ALL promise combinators — no built-in combinator (all, race, any, allSettled) has any power to cancel the underlying work of a promise it\'s observing; only an explicit mechanism like AbortController genuinely stops in-flight work.',
    },
  ];
}
