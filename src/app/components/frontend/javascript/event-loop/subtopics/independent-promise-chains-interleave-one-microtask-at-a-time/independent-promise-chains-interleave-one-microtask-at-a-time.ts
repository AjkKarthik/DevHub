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
  selector: 'app-promise-chains-interleave-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './independent-promise-chains-interleave-one-microtask-at-a-time.html',
  styleUrl: './independent-promise-chains-interleave-one-microtask-at-a-time.scss',
})
export class IndependentPromiseChainsInterleaveOneMicrotaskAtATimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Grounded in the Main Page\'s Own "Predict the Output" Challenge',
      points: [
        'The main page\'s challenge (Snippet 3) sets up two completely independent <code>Promise.resolve().then(...)</code> chains and asks you to predict the order their steps log in. Its solution states the surprising result plainly: "p1, p3, p2, p4" — NOT "p1, p2, p3, p4" (chain 1 fully, then chain 2) and NOT "p1, p3" happening simultaneously.',
        'This subtopic rebuilds that exact scenario with clearer, longer chains and step-by-step console output, so the ROUND-ROBIN nature of microtask draining — one queued callback per chain, per pass — is directly visible instead of just asserted.',
      ],
    },
    {
      heading: 'Why It Interleaves Instead of Running Depth-First',
      points: [
        'Each <code>.then()</code> call schedules its callback onto the SAME single, shared microtask queue — there is no per-chain queue. When the synchronous code finishes, both chains\' FIRST <code>.then()</code> callbacks are already sitting in that queue in the order they were attached: chain A\'s first step, then chain B\'s first step.',
        'The event loop drains the queue strictly in FIFO order. Chain A\'s first step runs, and if it schedules a NEXT step (by returning a promise or chaining another <code>.then()</code>), that new callback goes to the BACK of the queue — behind chain B\'s already-waiting first step, not ahead of it.',
        'The result is a round-robin-like interleaving: A1, B1, A2, B2, A3, B3, ... — each chain advances exactly one step per "pass" through the queue, because each step\'s continuation is appended to the back, not the front, of the same shared queue.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Independent Promise chains interleaving</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Two completely independent chains -- neither references the other at all.
console.log('--- Chain A and Chain B, both attached synchronously ---');

Promise.resolve()
  .then(() => { console.log('A1'); })
  .then(() => { console.log('A2'); })
  .then(() => { console.log('A3'); })
  .then(() => { console.log('A4'); });

Promise.resolve()
  .then(() => { console.log('B1'); })
  .then(() => { console.log('B2'); })
  .then(() => { console.log('B3'); })
  .then(() => { console.log('B4'); });

console.log('--- synchronous code done -- predict the interleaving before scrolling down ---');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Chain A and Chain B are completely independent — neither one awaits or references the other. Does Chain A fully finish (A1, A2, A3, A4) before Chain B starts, or do they interleave?',
    hint: 'Every .then() callback -- from BOTH chains -- goes into the exact same shared microtask queue. Think about what order things were ADDED to that one queue, one pass at a time.',
    solution: `The actual output is A1, B1, A2, B2, A3, B3, A4, B4 -- the two
chains interleave one step at a time, NOT depth-first.

Here's why: when the synchronous code finishes, the queue already
holds two entries in attachment order: A1's callback, then B1's
callback (Chain A was attached to the page first).

The event loop drains the queue strictly first-in-first-out:
- A1 runs. Its .then() schedules A2's callback -- appended to the
  BACK of the queue, behind B1 (which is already waiting there).
- B1 runs next (it was already ahead of A2 in the queue). Its
  .then() schedules B2 at the back, behind A2.
- A2 runs next, schedules A3 at the back...

This ping-pong pattern repeats for every step, because each new
continuation always joins the back of the SAME single queue instead
of jumping ahead of whatever chain was already queued. If Chain A
ran depth-first, all four of its callbacks would need their own
private queue -- but there is only ever one microtask queue, shared
by literally every Promise on the page.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two independent Promise chains that were started in the same synchronous block run completely independently — one finishing all of its steps before the other one\'s steps begin, since neither awaits the other.',
      reality: 'both chains schedule their callbacks onto the exact same SHARED microtask queue — the event loop drains that one queue in strict FIFO order, so the chains interleave one step at a time rather than one chain finishing before the next begins.',
    },
    {
      thought: 'the interleaving order between two chains is effectively random or depends on which promise "wins" some kind of race.',
      reality: 'the order is completely deterministic and spec-defined — it depends only on the order callbacks were attached and the strict FIFO discipline of the single shared microtask queue, with zero randomness involved.',
    },
    {
      thought: 'each .then() callback, when it schedules the NEXT step in its own chain, jumps to the front of the microtask queue since it "belongs" to a chain that\'s already in progress.',
      reality: 'a newly scheduled continuation always joins the BACK of the queue, exactly like a brand new, unrelated microtask would — the queue has no concept of "chains" or priority; it is a single, flat, FIFO list of callbacks.',
    },
  ];
}
