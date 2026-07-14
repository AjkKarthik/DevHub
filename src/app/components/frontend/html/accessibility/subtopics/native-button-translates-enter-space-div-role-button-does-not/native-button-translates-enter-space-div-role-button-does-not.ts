import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-native-button-translates-enter-space-div-role-button-does-not',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './native-button-translates-enter-space-div-role-button-does-not.html',
  styleUrl: './native-button-translates-enter-space-div-role-button-does-not.scss'
})
export class NativeButtonTranslatesEnterSpaceDivRoleButtonDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A native <button> synthesizes a click event from Enter and Space for free',
      points: [
        'The main page\'s Rule 3 and its matching Common Mistake spell this out: "A div with role=\'button\' still needs tabindex=\'0\' plus separate keydown handlers for Enter and Space — adding ARIA when the native element works perfectly is always wrong."',
        'This is real, spec-guaranteed browser behavior, not a convention developers have to remember to implement for native elements: a <code>&lt;button&gt;</code> (and <code>&lt;a href&gt;</code>, and other natively-interactive elements) automatically translates a genuine Enter or Space keypress into the same <code>click</code> event a mouse click would fire.',
      ]
    },
    {
      heading: '<div role="button"> only LOOKS the same — it gets none of that for free',
      points: [
        'Giving a <code>&lt;div&gt;</code> <code>role="button"</code> and <code>tabindex="0"</code> makes it announce as a button and become keyboard-focusable — but it does NOT make Enter or Space activate it. Only a click handler fires on an actual mouse click (or a touch tap); the keyboard never triggers it unless you write your own <code>keydown</code> listener checking for <code>Enter</code> and <code>Space</code>.',
        'This is the single biggest reason the main page\'s Rule 1 (use native HTML first) exists: <code>&lt;button&gt;</code> gets correct keyboard behavior, focus styling, and form-submission integration all for free — a div with ARIA sprinkled on top has to painstakingly reimplement each of those individually, and it is very easy to reimplement some but not all of them.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>native button vs div role=button keyboard activation</title>
    <style>
      [role="button"] { display: inline-block; padding: 0.4em 0.8em; border: 1px solid #999; cursor: pointer; }
      [role="button"]:focus { outline: 3px solid orange; }
    </style>
  </head>
  <body>
    <p>Tab to each control below, then press Enter or Space on it — watch the log.</p>
    <button id="nativeBtn">Native &lt;button&gt;</button>
    <div id="divBtn" role="button" tabindex="0">div role="button" (click handler only)</div>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

function log(line: string) {
  output.textContent += line + '\\n';
}

const nativeBtn = document.getElementById('nativeBtn')!;
const divBtn = document.getElementById('divBtn')!;

// BOTH elements only get a click handler — no keydown handler on either one.
// The native button will still respond to a REAL Enter/Space keypress because
// the browser itself translates that into a click event automatically.
// The div will only respond to an actual mouse click or touch tap.
nativeBtn.addEventListener('click', () => log('✓ native <button> received a click event (mouse OR keyboard-synthesized)'));
divBtn.addEventListener('click', () => log('✓ div role="button" received a click event (mouse/touch ONLY — try pressing Enter on it!)'));

log('Tab to each control and press Enter or Space to see which one actually responds.');
log('(Neither element has a keydown listener — only click listeners, exactly as written above.)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Neither control above has a <code>keydown</code> event listener — only <code>click</code> listeners. Tab to the native <code>&lt;button&gt;</code> and press Enter. Then tab to the <code>div role="button"</code> and press Enter. Predict which one logs a response.',
    hint: 'The main page\'s Rule 3 states custom ARIA controls need YOU to add keyboard handlers yourself — native elements do not need this because the browser already handles it internally.',
    solution: `Only the native <button> logs a response — the div role="button" does nothing when Enter is
pressed, because click listeners only fire in response to actual pointer/touch activation OR a
browser-synthesized click, and browsers only perform that automatic Enter/Space-to-click synthesis
for genuinely native interactive elements (button, a[href], input, etc.), never for a plain div
regardless of its role attribute. This is exactly the gap Rule 3 warns about: role="button" changes
what's ANNOUNCED, not what actually RESPONDS to a keyboard.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding <code>role="button"</code> and <code>tabindex="0"</code> to a div makes it behave like a real button in every respect a screen reader or keyboard user would notice.',
      reality: 'It only affects what gets ANNOUNCED (role) and whether it can receive focus (tabindex). It does not add any of the browser\'s native Enter/Space-to-click translation — that still has to be hand-implemented with a keydown listener.'
    },
    {
      thought: 'If a custom control has a working <code>onclick</code> handler, keyboard users can activate it too, since Enter and Space just trigger clicks everywhere.',
      reality: 'Enter/Space-triggers-click is a special browser behavior reserved for NATIVELY interactive elements. A div\'s click handler only fires from real mouse clicks or touch taps unless you add your own keydown listener that calls the handler (or dispatches a click) on Enter/Space.'
    },
    {
      thought: 'This kind of bug would be obvious immediately — a broken button is easy to notice while testing.',
      reality: 'It is invisible during normal mouse-based testing, since the click handler DOES work for mouse clicks. It only surfaces when someone tries to operate the control with a keyboard alone — exactly the population most likely to be missed during casual manual testing.'
    },
  ];
}
