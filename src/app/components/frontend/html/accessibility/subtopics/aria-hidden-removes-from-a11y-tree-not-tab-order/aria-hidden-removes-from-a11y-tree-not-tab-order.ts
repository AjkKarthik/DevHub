import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-aria-hidden-removes-from-a11y-tree-not-tab-order',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './aria-hidden-removes-from-a11y-tree-not-tab-order.html',
  styleUrl: './aria-hidden-removes-from-a11y-tree-not-tab-order.scss'
})
export class AriaHiddenRemovesFromA11yTreeNotTabOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two separate systems: the accessibility tree, and the tab order',
      points: [
        'The main page\'s Rule 4 and its matching Common Mistake are direct: "<code>aria-hidden</code> removes an element from the accessibility tree but NOT the tab order. Keyboard users can tab to an invisible control with no name — a critical trap."',
        '<code>aria-hidden="true"</code> only affects what screen readers can perceive — it never touches <code>tabIndex</code>, focusability, or whether <code>element.focus()</code> works. These are two completely independent systems the browser tracks separately.',
      ]
    },
    {
      heading: 'This is directly, reliably provable with plain DOM properties',
      points: [
        'Setting <code>aria-hidden="true"</code> on a <code>&lt;button&gt;</code> element does not change its <code>tabIndex</code> property at all — it remains <code>0</code>, exactly as if the attribute were never set.',
        'Calling <code>.focus()</code> on that hidden-but-focusable button still works and moves <code>document.activeElement</code> to it — proving the keyboard trap is real, not just theoretical: a sighted keyboard user tabbing through the page lands on a control a screen reader user is told does not exist.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>aria-hidden vs tab order</title>
    <style>
      [aria-hidden="true"] { opacity: 0.3; } /* just to visualize which one is "hidden" */
    </style>
  </head>
  <body>
    <button id="normalBtn">Normal button</button>
    <button id="hiddenBtn" aria-hidden="true">aria-hidden button (still focusable!)</button>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const normalBtn = document.getElementById('normalBtn') as HTMLButtonElement;
const hiddenBtn = document.getElementById('hiddenBtn') as HTMLButtonElement;

function report(btn: HTMLButtonElement, label: string): string {
  btn.focus();
  const gotFocus = document.activeElement === btn;
  return \`\${label}\\n  aria-hidden = \${btn.getAttribute('aria-hidden') ?? '(not set)'}\\n  tabIndex = \${btn.tabIndex}\\n  .focus() worked (document.activeElement === this button)? \${gotFocus}\\n\`;
}

output.textContent =
  report(normalBtn, 'Normal button:') + '\\n' +
  report(hiddenBtn, 'aria-hidden="true" button:') + '\\n' +
  'Both buttons report tabIndex 0 and both successfully receive focus — aria-hidden\\n' +
  'made zero difference to keyboard reachability. A screen reader user is told this\\n' +
  'second button does not exist, while a keyboard-only sighted user can still land on it.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The demo proves both buttons have identical <code>tabIndex</code> and both accept focus. Predict: if you additionally set <code>tabindex="-1"</code> on the aria-hidden button (in ADDITION to aria-hidden), would that actually fix the accessibility problem, or just change a different part of it?',
    hint: 'The main page\'s recommended fix for a button that must stay in the DOM is to give it a proper accessible name instead of hiding it — removing it from keyboard reach is a different, usually wrong, fix for a still-visible interactive control.',
    solution: `Adding tabindex="-1" would remove it from the DEFAULT Tab-key sequence, closing the specific
"keyboard user tabs to an invisible, unnamed control" trap — but only by making the button
completely unreachable by keyboard for EVERYONE, sighted or not, which is usually the wrong fix for
a control that is still visually present and clickable. The main page's actual guidance is more
targeted: if the element is purely decorative, remove it from the DOM entirely (or use a non-focusable
tag); if it's a real, usable control, give it a genuine accessible name via aria-label instead of
hiding it. tabindex="-1" trades one accessibility bug for a different one rather than fixing the
underlying problem.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>aria-hidden="true"</code> is roughly equivalent to <code>display: none</code> — it removes the element from the page entirely for every kind of user.',
      reality: 'It only removes the element from the ACCESSIBILITY TREE — the element still renders visually (unless separately hidden with CSS) and still fully participates in keyboard Tab navigation and focus.'
    },
    {
      thought: 'Setting <code>tabIndex</code> and setting <code>aria-hidden</code> are two ways of achieving the same "hide from assistive tech" goal.',
      reality: 'They control two independent systems: <code>tabIndex</code> governs keyboard focus order, <code>aria-hidden</code> governs the accessibility tree exposed to screen readers. Setting one never implicitly changes the other.'
    },
    {
      thought: 'This kind of accessibility bug can only really be caught by manually testing with an actual screen reader.',
      reality: 'The keyboard-trap half of this specific bug is directly, mechanically provable with plain DOM properties (<code>tabIndex</code>, <code>.focus()</code>, <code>document.activeElement</code>) — no assistive technology required to catch it, exactly as demonstrated above.'
    },
  ];
}
