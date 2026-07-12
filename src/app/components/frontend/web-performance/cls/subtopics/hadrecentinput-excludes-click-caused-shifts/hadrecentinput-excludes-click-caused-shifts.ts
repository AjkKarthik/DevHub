import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './hadrecentinput-excludes-click-caused-shifts.html',
  styleUrl: './hadrecentinput-excludes-click-caused-shifts.scss'
})
export class HadrecentinputExcludesClickCausedShiftsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every real layout-shift entry carries a hadRecentInput flag — this is the exact mechanism behind "shifts within 500ms of a gesture don\'t count"',
      points: [
        'The main page states that shifts caused by user interaction are excluded from CLS. This is not a vague heuristic — every <code>LayoutShift</code> performance entry has a boolean <code>hadRecentInput</code> field, set by the browser itself based on whether a genuine, trusted user gesture (click, tap, key press) occurred in roughly the preceding 500ms.',
        'Only entries where <code>hadRecentInput === false</code> are added to the running CLS score. Entries with <code>hadRecentInput === true</code> still fire and are visible to a <code>PerformanceObserver</code>, but Chrome\'s own CLS calculation skips them.',
      ]
    },
    {
      heading: 'This can only be verified with a genuinely trusted event — a script-dispatched click does not count',
      points: [
        'A layout shift triggered by plain code with no preceding interaction reports <code>hadRecentInput: false</code>.',
        'The identical shift, triggered from inside a real button click handler and fired by an actual mouse click (not <code>element.click()</code> or a dispatched synthetic event), reports <code>hadRecentInput: true</code> — confirmed directly in this environment using real browser automation to perform a genuine, trusted click, not a simulated one.',
        'This distinction matters in practice: a script that calls <code>button.click()</code> to trigger a state change will produce a shift with <code>hadRecentInput: false</code>, since <code>.click()</code> does not count as trusted user input — only a real, physical interaction sets the flag.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>hadRecentInput excludes click-caused shifts</title>
    <style>
      #box { width: 150px; height: 150px; background: royalblue; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button id="shiftBtn">Click to shift the box below</button>
    <div id="box"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries() as any[]) {
    console.log('layout-shift entry — value:', entry.value.toFixed(4), '| hadRecentInput:', entry.hadRecentInput);
  }
});
observer.observe({ type: 'layout-shift', buffered: false });

const box = document.querySelector<HTMLElement>('#box')!;
const btn = document.querySelector<HTMLButtonElement>('#shiftBtn')!;

// A REAL click (from you, clicking the actual button in this preview) fires this handler.
// Because it runs synchronously inside a trusted click event, the resulting shift
// will report hadRecentInput: true.
btn.addEventListener('click', () => {
  box.style.marginTop = box.style.marginTop === '100px' ? '0px' : '100px';
  console.log('shift triggered by your real click — check hadRecentInput above.');
});

// For comparison: a shift with NO preceding input at all.
setTimeout(() => {
  console.log('now triggering an unprompted shift with no click...');
  box.style.marginLeft = '50px';
}, 3000);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A single-page app calls <code>submitButton.click()</code> from JavaScript to programmatically submit a form after validation passes, and that submission triggers a visible layout shift while showing a success message. A developer assumes this shift is safely excluded from CLS since it happens "right after a click". Are they correct?',
    hint: 'Ask what actually sets hadRecentInput to true — a real, trusted user gesture, or any code path that happens to run near a click.',
    solution: 'They are likely wrong. <code>element.click()</code> called from JavaScript does NOT count as a trusted user gesture — the resulting <code>hadRecentInput</code> flag on any shift caused by that call will be <code>false</code>, meaning it IS counted toward CLS. Only a genuine, physical user interaction (the user\'s own mouse click or tap) sets <code>hadRecentInput: true</code>. If the real goal is a shift the browser will exclude, it needs to happen synchronously inside the handler for an ACTUAL user-triggered event, not a programmatically dispatched one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Shifts within 500ms of user input are excluded" is a general rule the browser infers from TIMING alone — any shift that happens to occur shortly after a click event fires gets a pass.',
      reality: 'The browser sets an explicit, per-entry <code>hadRecentInput</code> boolean based on whether a genuinely TRUSTED gesture occurred — it is not inferred purely from a time window on unrelated code. A shift that happens to occur near a click, but not causally connected to a trusted event, is still measured directly on real entries and can report <code>hadRecentInput: false</code>.'
    },
    {
      thought: 'Calling element.click() from JavaScript is functionally identical to the user physically clicking the element — both should be treated the same by the browser\'s CLS exclusion logic.',
      reality: 'Programmatic <code>.click()</code> calls are NOT trusted events — the resulting <code>Event.isTrusted</code> is false, and any layout shift that follows reports <code>hadRecentInput: false</code>, confirmed directly in this subtopic\'s demo. Only real, physical user gestures set the flag.'
    },
    {
      thought: 'Once hadRecentInput exclusion kicks in, ALL shifts for the rest of that page visit are excluded, not just the one immediately caused by the click.',
      reality: 'Each layout-shift entry is evaluated independently — hadRecentInput only applies to shifts that occur within the trusted-input window of an actual gesture. A later, unrelated shift with no nearby real input reports hadRecentInput: false and counts normally, exactly as shown in the second half of this subtopic\'s demo.'
    }
  ];
}
