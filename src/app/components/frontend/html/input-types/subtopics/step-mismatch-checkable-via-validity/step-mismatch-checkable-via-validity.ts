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
  templateUrl: './step-mismatch-checkable-via-validity.html',
  styleUrl: './step-mismatch-checkable-via-validity.scss'
})
export class StepMismatchCheckableViaValiditySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'step defines the granularity of valid values, and a violation is a real, checkable ValidityState flag',
      points: [
        '<code>step="2"</code> on a <code>min="0"</code> number input means only 0, 2, 4, 6… are valid — any other value is a genuine constraint violation the browser tracks for you.',
        'Unlike a bogus input <code>type</code> (silently downgraded) or an unparseable number string (silently emptied), an off-step value is neither rejected nor rewritten — it stays exactly as set, but the input\'s <code>ValidityState</code> flags it as invalid via <code>.stepMismatch</code>.',
      ]
    },
    {
      heading: 'checkValidity() / reportValidity() surface stepMismatch without any custom arithmetic on your part',
      points: [
        '<code>el.validity.stepMismatch</code> is a boolean you can read directly — no need to compute <code>(value - min) % step</code> yourself.',
        '<code>el.checkValidity()</code> returns the combined validity across every constraint (step, min, max, required, pattern…) as a single boolean, and fires an <code>invalid</code> event if it fails — <code>el.reportValidity()</code> does the same but also shows the browser\'s native validation bubble.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>step mismatch and ValidityState</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <input type="number" id="num" min="0" max="10" step="2" />
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const num = document.querySelector<HTMLInputElement>('#num')!;
// min="0" max="10" step="2" -> only 0, 2, 4, 6, 8, 10 are on-step.

function tryValue(v: string) {
  num.value = v;
  console.log(\\\`value "\\\${v}" -> stepMismatch: \\\${num.validity.stepMismatch}, valid overall: \\\${num.checkValidity()}\\\`);
}

// On-step: no violation.
tryValue('4');

// Off-step: value is kept exactly as set, but flagged invalid.
tryValue('3');

// Back on-step again.
tryValue('10');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A number input has <code>min="0" step="2"</code>. Its value is set to <code>"5"</code>. Does the browser reject or rewrite that value, or does something else happen?',
    hint: 'Compare this to the previous two subtopics: an unparseable number string gets emptied, and a bogus <code>type</code> gets silently downgraded. step mismatches follow neither pattern.',
    solution: 'Neither — <code>el.value</code> stays exactly "5", nothing is rewritten or rejected. Only <code>el.validity.stepMismatch</code> becomes <code>true</code> (and <code>el.checkValidity()</code> returns <code>false</code>), leaving it up to your code — or native form submission — to act on that flag.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>step</code> only affects how a <code>type="range"</code> slider snaps as you drag it — it has no effect on <code>type="number"</code> or other input types.',
      reality: '<code>step</code> is a general constraint-validation attribute that applies to every input type that supports it (<code>number</code>, <code>range</code>, <code>date</code>, <code>time</code>, and more), producing the exact same checkable <code>.stepMismatch</code> flag regardless of which type is snapping visually vs. only validating.'
    },
    {
      thought: 'To know whether a value respects <code>step</code>, you need to write your own <code>(value - min) % step === 0</code> check.',
      reality: 'The browser already computes this for you — <code>el.validity.stepMismatch</code> is a live boolean reflecting exactly that calculation, with edge cases (like floating-point step values) already handled per spec.'
    },
    {
      thought: 'An input failing <code>stepMismatch</code> means the browser prevents that value from ever being set or typed in the first place.',
      reality: 'It does not block anything — off-step values can be typed or assigned freely and remain in <code>.value</code> unchanged. The browser only flags them as invalid; whether that blocks form submission depends on <code>checkValidity()</code>/native constraint validation actually being triggered.'
    }
  ];
}
