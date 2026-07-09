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
  selector: 'app-hidden-write-layout-thrashing-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './hidden-write-causes-layout-thrashing.html',
  styleUrl: './hidden-write-causes-layout-thrashing.scss',
})
export class HiddenWriteInThirdPartyCallStillCausesLayoutThrashingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Final QnA — a Genuine Debugging Trap, Made Directly Visible',
      points: [
        'The main page\'s last QnA poses exactly this scenario: reading <code>offsetHeight</code>, calling an opaque third-party function you don\'t control, then reading <code>offsetHeight</code> again — and answers "Yes" to whether this can still cause layout thrashing, "even though you never explicitly wrote a DOM style in between your own two reads." This subtopic makes that answer directly observable using the browser\'s own timing, not just a described claim.',
        'Layout thrashing depends entirely on whether ANY write happened between two reads — not on WHOSE code wrote it. A style change, class toggle, or DOM insertion buried inside a "black box" function call between your two reads is just as capable of forcing a synchronous reflow as a write you wrote yourself.',
      ],
    },
    {
      heading: 'Why This Is a Debugging Trap Specifically',
      points: [
        'A code review that only looks at YOUR OWN read/write ordering can look perfectly safe — two reads with a plain function call in between, no visible <code>.style</code> assignment anywhere in your code. The forced reflow is invisible in the source unless you also inspect what that called function does internally.',
        'The main page\'s answer specifically recommends the browser\'s own Performance panel ("Forced reflow" warnings) as the tool that catches this regardless of where the offending write originates — since it observes actual runtime behavior rather than relying on someone tracing every call\'s internals by eye.',
        'This subtopic demonstrates the mechanism using <code>performance.now()</code> timing differences instead of the DevTools Performance panel, since that requires no manual profiling steps to observe in a live console — but the underlying browser behavior being measured is identical to what the Performance panel\'s "Forced reflow" warning flags.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Hidden write causes layout thrashing</title></head>
  <body>
    <div id="box" style="width: 100px; height: 100px; background: steelblue;"></div>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const box = document.getElementById('box')!;

// A "third-party" function you supposedly don't control.
// It looks completely unrelated to layout -- just some bookkeeping.
function thirdPartyLogger(el: HTMLElement) {
  console.log('  [third-party] logging visit for element:', el.id);
  el.classList.add('visited'); // <-- a HIDDEN write buried inside an "innocent" call
}

function measureWithHiddenWrite() {
  const t0 = performance.now();
  const h1 = box.offsetHeight;          // read #1
  const t1 = performance.now();

  thirdPartyLogger(box);                // opaque call -- writes a class internally

  const t2 = performance.now();
  const h2 = box.offsetHeight;          // read #2 -- forced to recompute layout NOW
  const t3 = performance.now();

  console.log('read #1 took', (t1 - t0).toFixed(3) + 'ms');
  console.log('third-party call took', (t2 - t1).toFixed(3) + 'ms');
  console.log('read #2 took', (t3 - t2).toFixed(3) + 'ms', '<-- forced synchronous reflow, even though YOUR code never wrote a style directly');
}

function measureWithNoWriteBetween() {
  const t0 = performance.now();
  const h1 = box.offsetHeight;          // read #1
  const t1 = performance.now();

  console.log('  [no write] just some non-DOM computation happening here');
  let sum = 0;
  for (let i = 0; i < 1000; i++) sum += i;  // pure computation, no DOM interaction

  const t2 = performance.now();
  const h2 = box.offsetHeight;          // read #2 -- layout is still valid, cheap
  const t3 = performance.now();

  console.log('read #1 took', (t1 - t0).toFixed(3) + 'ms');
  console.log('non-DOM work took', (t2 - t1).toFixed(3) + 'ms');
  console.log('read #2 took', (t3 - t2).toFixed(3) + 'ms', '<-- cheap, layout was never invalidated');
}

console.log('--- Scenario A: hidden write inside a "third-party" call ---');
measureWithHiddenWrite();

console.log('--- Scenario B: no write at all between the two reads ---');
measureWithNoWriteBetween();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In Scenario A, your own code never writes a <code>.style</code> property directly — the write happens inside <code>thirdPartyLogger()</code>. Does the second <code>offsetHeight</code> read still force a synchronous layout recalculation?',
    hint: 'Layout thrashing is triggered by ANY DOM write happening between two reads, regardless of which function in the call stack performed it -- ask whether the browser can tell the difference between "your" write and someone else\'s.',
    solution: `Yes -- the second offsetHeight read in Scenario A still forces a
synchronous reflow, and you can see this reflected in its
measurably higher timing compared to Scenario B's second read.

The browser has no concept of "whose" write it was -- it only
tracks whether the DOM/style state has changed since layout was
last computed. thirdPartyLogger() calling el.classList.add('visited')
invalidates the cached layout just as effectively as if you'd
written el.style.height = '150px' directly in your own code. The
very next read of a layout property (offsetHeight) after that
invalidation forces the browser to synchronously recompute layout
before it can return a value -- there's no way to read a stale,
cheap value once ANY write has happened, no matter how it got there.

Scenario B, by contrast, does real work (a loop) between the two
reads, but that work never touches the DOM -- so the cached layout
from read #1 is still valid, and read #2 stays cheap.

This is exactly the trap the main page's QnA describes: a code
review of your own read/write ordering can look completely clean,
while a write hidden inside a library call you didn't inspect still
triggers the same expensive reflow. The fix isn't just "don't write
between your own reads" -- it's "know what every function you call
between two reads actually does," or better, profile with the
DevTools Performance panel's "Forced reflow" warnings, which catch
this regardless of where the write originates.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'layout thrashing can only happen if YOUR OWN code writes a DOM style or attribute between two layout reads — a plain function call to code you don\'t control can\'t be the cause.',
      reality: 'the browser has no concept of whose code performed a write — ANY DOM mutation between two layout reads invalidates the cached layout, whether it happened in your code or inside an opaque third-party function call.',
    },
    {
      thought: 'reviewing your own code\'s read/write ordering by eye is a reliable way to catch and prevent all layout thrashing bugs.',
      reality: 'a code review of your own read/write ordering can miss thrashing entirely if the write is buried inside a called function\'s internals — the main page specifically recommends profiling with the browser\'s Performance panel ("Forced reflow" warnings) instead, since it observes actual runtime behavior rather than relying on tracing every call by eye.',
    },
    {
      thought: 'calling a function between two layout reads is always safe as long as that function doesn\'t obviously look like it touches the DOM (no "style" or "DOM" in its name, no visual side effect you can see).',
      reality: 'a function\'s name or apparent purpose gives no guarantee about its internal behavior — any call that toggles a class, sets a style, or inserts/removes an element internally invalidates layout, regardless of what the function is "supposed" to do or how innocuous its name sounds.',
    },
  ];
}
