import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lvhfa-source-order-decides-the-equal-specificity-winner',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './lvhfa-source-order-decides-the-equal-specificity-winner.html',
  styleUrl: './lvhfa-source-order-decides-the-equal-specificity-winner.scss'
})
export class LvhfaSourceOrderDecidesTheEqualSpecificityWinnerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'a:link, a:visited, a:focus, a:hover, and a:active all have identical specificity',
      points: [
        'The main page states the rule directly: "Equal specificity means later rules win — wrong order causes states to not appear." A single pseudo-class selector like <code>a:focus</code> has exactly the same specificity weight as <code>a:link</code> or <code>a:hover</code> — the browser has no tiebreaker beyond source order once specificity is tied.',
        'This means when a link is simultaneously eligible for two of these states — for example, an unvisited link that is currently focused, matching both <code>a:link</code> and <code>a:focus</code> — the CSS rule that appears LATER in the stylesheet wins, regardless of which state feels more "important."',
      ]
    },
    {
      heading: 'This is directly, reliably testable — no mouse hover needed',
      points: [
        'Unlike <code>:hover</code>, which needs genuine pointer movement to trigger, <code>:focus</code> can be set programmatically with a plain <code>element.focus()</code> call — making the LVHFA ordering rule something you can prove with a script rather than a screenshot.',
        'The correct <strong>L</strong>ink, <strong>V</strong>isited, <strong>H</strong>over, <strong>F</strong>ocus, <strong>A</strong>ctive ordering places <code>:focus</code> after <code>:link</code> specifically so a focused-but-unvisited link\'s focus style is not silently overridden by the earlier link-color rule.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>LVHFA source order</title>
    <style>
      /* WRONG order: :focus declared BEFORE :link — :link wins on focus */
      #wrongOrderLink:focus { color: limegreen; outline: 3px solid limegreen; }
      #wrongOrderLink:link  { color: blue; }

      /* CORRECT order: :link declared BEFORE :focus — :focus wins on focus */
      #correctOrderLink:link  { color: blue; }
      #correctOrderLink:focus { color: limegreen; outline: 3px solid limegreen; }
    </style>
  </head>
  <body>
    <p><a id="wrongOrderLink" href="#nowhere-1">Wrong order link (:focus rule declared first)</a></p>
    <p><a id="correctOrderLink" href="#nowhere-2">Correct order link (:link rule declared first)</a></p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

const wrongLink = document.getElementById('wrongOrderLink') as HTMLAnchorElement;
const correctLink = document.getElementById('correctOrderLink') as HTMLAnchorElement;

function checkFocusColor(link: HTMLAnchorElement, label: string): string {
  link.focus();
  const color = getComputedStyle(link).color;
  const isGreen = color.includes('50, 205, 50') || color === 'limegreen'; // rgb(50, 205, 50)
  return \`\${label}: focused color = \${color}   →   :focus style won? \${isGreen}\`;
}

output.textContent =
  checkFocusColor(wrongLink, 'Wrong order (:focus before :link) ') + '\\n' +
  checkFocusColor(correctLink, 'Correct order (:link before :focus)') + '\\n\\n' +
  'Both links use the SAME two rules, just declared in a different order — the only\\n' +
  'variable here is source order, since both selectors have identical specificity.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The "wrong order" link declares <code>:focus</code> BEFORE <code>:link</code> in the stylesheet. Predict: when that link is focused, does it render green (the :focus color) or blue (the :link color)?',
    hint: '<code>a:focus</code> and <code>a:link</code> have identical specificity — with no other tiebreaker, the CSS cascade falls back to whichever rule appears LATER in the source.',
    solution: `It renders blue — the :link color, even though the link IS genuinely focused. Because :link is
declared AFTER :focus in that block, and both selectors tie on specificity, the later rule wins the
cascade regardless of which pseudo-class more accurately describes the link's current state. This is
exactly why LVHFA order matters: getting :focus's position wrong doesn't cause an error, it just
makes the focus indicator silently never appear.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CSS automatically prioritizes a more "specific" state like :focus or :active over a more general one like :link, similar to how ID selectors beat class selectors.',
      reality: 'All five LVHFA pseudo-classes have IDENTICAL specificity when applied to the same base selector. There is no built-in prioritization between them — only source order decides ties.'
    },
    {
      thought: 'Testing which link-state CSS rule "wins" requires an actual mouse hover, which is hard to do in an automated test.',
      reality: ':focus can be triggered with a plain <code>element.focus()</code> JavaScript call, making this specific ordering rule fully testable without any simulated pointer interaction.'
    },
    {
      thought: 'If a focus style silently fails to appear, the CSS itself must be wrong — a typo, a missing selector, or a specificity conflict from elsewhere on the page.',
      reality: 'It can just as easily be a correct, typo-free rule that is simply declared in the wrong ORDER relative to an equal-specificity rule earlier or later in the same stylesheet — worth checking before assuming the selector itself is broken.'
    },
  ];
}
