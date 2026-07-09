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
  selector: 'app-capture-before-bubble-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './capture-fires-before-bubble-in-strict-outside-in-order.html',
  styleUrl: './capture-fires-before-bubble-in-strict-outside-in-order.scss',
})
export class CaptureFiresBeforeBubbleInStrictOutsideInOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Code Example, Run Live to Prove the Order',
      points: [
        'The main page\'s "Event Phases & Options" tab walks through exactly this three-listener setup and states the resulting order: "outer capture → inner bubble → outer bubble". This subtopic runs that EXACT scenario live and logs each listener firing with a timestamp, so the three-phase order is directly observed rather than just read as a comment in a code sample.',
        'A single click on the innermost element triggers ALL THREE listeners, in a specific, fixed order dictated entirely by which PHASE each listener registered for — not by which element is "closest" to the click, and not by the order the listeners were attached in the source code.',
      ],
    },
    {
      heading: 'Why the Order Is capture (outer→inner) → target → bubble (inner→outer)',
      points: [
        'The browser sends every event on a journey: first DOWN from the window to the target element (the <strong>capture phase</strong>), then it fires directly on the target (the <strong>target phase</strong>), then back UP from the target to the window (the <strong>bubble phase</strong>). A listener registered with <code>{ capture: true }</code> only fires during that downward leg; a listener WITHOUT that option (the default) only fires during the upward leg.',
        'This means a capture-phase listener on an OUTER ancestor always fires before a bubble-phase listener on an INNER descendant, even though the inner element is "closer" to where the click actually happened — the capture phase\'s outside-in sweep always completes its relevant portion before the bubble phase\'s inside-out sweep even begins.',
        'Two listeners on the exact SAME element, one for each phase, would both still respect this: a <code>{capture: true}</code> listener on an element fires before that element\'s own default (bubble) listener, since capture-phase listeners on ANY ancestor (including the target element itself, conceptually) resolve before the bubble sweep starts.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Capture vs bubble phase order demo</title></head>
  <body>
    <div id="outer" style="padding: 20px; background: #ddd;">
      outer
      <div id="inner" style="padding: 20px; background: #bbb;">
        inner
        <button id="btn">Click me</button>
      </div>
    </div>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const outer = document.getElementById('outer')!;
const inner = document.getElementById('inner')!;
const btn = document.getElementById('btn')!;

const log: string[] = [];

outer.addEventListener('click', () => {
  log.push('1: outer CAPTURE');
  console.log('outer capture phase listener fired');
}, { capture: true });

inner.addEventListener('click', () => {
  log.push('2: inner CAPTURE');
  console.log('inner capture phase listener fired');
}, { capture: true });

btn.addEventListener('click', () => {
  log.push('3: button TARGET (registered as bubble, but fires during target phase)');
  console.log('button (target) listener fired');
});

inner.addEventListener('click', () => {
  log.push('4: inner BUBBLE');
  console.log('inner bubble phase listener fired');
});

outer.addEventListener('click', () => {
  log.push('5: outer BUBBLE');
  console.log('outer bubble phase listener fired');
});

console.log('Simulating a click on the button...');
btn.click();

console.log('--- Final order the 5 listeners fired in ---');
log.forEach(entry => console.log(entry));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Five listeners are attached across three elements — two in capture phase, two in bubble phase, and one on the target itself. Predict the firing order before running: does "inner BUBBLE" fire before or after "outer CAPTURE"?',
    hint: 'Think of it as two separate one-way sweeps through the ancestor chain -- one sweep travels all the way down BEFORE the second sweep, which travels back up, even starts.',
    solution: `The actual order is: outer CAPTURE, inner CAPTURE, button TARGET,
inner BUBBLE, outer BUBBLE -- "inner BUBBLE" fires AFTER "outer
CAPTURE", not before it, even though "inner" as an element is
physically closer to the button than "outer" is.

The mental model that gets this right: picture the event traveling
down from window to the button first (capture phase: outer, then
inner, since capture goes OUTSIDE-IN), then firing on the button
itself (target phase), then traveling back up from the button to
window (bubble phase: inner, then outer, since bubble goes
INSIDE-OUT).

The capture sweep and the bubble sweep are two completely separate,
sequential passes -- the ENTIRE capture sweep (both outer and inner)
finishes before the bubble sweep (inner, then outer) even starts.
This is why "outer CAPTURE" -- despite being the outer element --
fires before "inner BUBBLE", which is easy to get backwards if you
assume proximity to the click target determines firing order rather
than which phase (and which direction of the sweep) a listener
belongs to.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'listeners fire in an order determined by how close their element is to the element that was actually clicked — closer elements fire before farther ones, regardless of capture/bubble settings.',
      reality: 'firing order is determined entirely by PHASE (capture vs. bubble), not proximity — a capture-phase listener on a distant ancestor fires before a bubble-phase listener on a much closer element, since the entire capture sweep completes before the bubble sweep begins.',
    },
    {
      thought: 'the capture and bubble phases interleave — as the event travels down through ancestors during capture, it immediately travels back up through the same ancestors for bubble, alternating between the two.',
      reality: 'capture and bubble are two entirely separate, sequential sweeps — capture travels ALL THE WAY DOWN to the target first (visiting every capture-phase listener along the way), and only after that completely finishes does the bubble sweep begin traveling back up.',
    },
    {
      thought: 'the order listeners were attached in the source code (registered earlier vs. later) is what determines their firing order when a click happens.',
      reality: 'attachment order in the source code has no bearing on firing order across DIFFERENT elements — only the phase (capture vs. bubble) and the element\'s position in the ancestor chain matter; attachment order only matters for breaking ties between MULTIPLE listeners on the exact SAME element in the exact SAME phase.',
    },
  ];
}
