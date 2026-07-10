import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-col-only-supports-background-border-visibility-width',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './col-only-supports-background-border-visibility-width.html',
  styleUrl: './col-only-supports-background-border-visibility-width.scss'
})
export class ColOnlySupportsBackgroundBorderVisibilityWidthSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '<col> doesn\'t exist in the rendered box tree the way a <td> does',
      points: [
        'The main page states it directly: "Only a subset of CSS properties apply to <code>&lt;col&gt;</code>: <code>background</code>, <code>border</code>, <code>visibility</code>, <code>width</code>." This is a genuinely short list — most everyday CSS properties simply have no effect when applied to a <code>&lt;col&gt;</code> element at all.',
        'The reason is architectural: <code>&lt;col&gt;</code> doesn\'t correspond to its own rendered box the way a table cell does. It exists purely to describe column-level metadata (width, and a small set of special-cased visual properties) that the table layout algorithm consults while painting the ACTUAL cells — properties like <code>color</code>, <code>font-weight</code>, or <code>padding</code> have no cell of their own to apply to.',
      ]
    },
    {
      heading: 'This is easy to get wrong because <col> LOOKS like a normal selector target',
      points: [
        'Nothing about the syntax <code>&lt;col style="color: red"&gt;</code> looks invalid — it parses fine, causes no console warning or error, and simply does nothing. This silent no-op is what makes the restriction a genuine gotcha rather than an obvious mistake you\'d catch immediately.',
        'You can verify exactly which properties take effect by reading <code>getComputedStyle()</code> on the actual <code>&lt;td&gt;</code> cells in that column (not the <code>&lt;col&gt;</code> itself) — a cell\'s computed <code>background-color</code> will reflect the <code>&lt;col&gt;</code>\'s styling, but its computed <code>color</code> and <code>font-weight</code> will not, even though both were set identically on the same <code>&lt;col&gt;</code> element.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>col CSS property restrictions</title>
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #999; padding: 0.5rem 0.75rem; }
      #styledCol {
        background: #ffe4b5;   /* SUPPORTED on col */
        color: red;             /* NOT supported on col */
        font-weight: bold;      /* NOT supported on col */
        padding: 2rem;          /* NOT supported on col */
      }
    </style>
  </head>
  <body>
    <table id="demoTable">
      <colgroup>
        <col>
        <col id="styledCol">
      </colgroup>
      <tr><th>Plain column</th><th>Styled column</th></tr>
      <tr><td>Row 1 A</td><td>Row 1 B</td></tr>
      <tr><td>Row 2 A</td><td>Row 2 B</td></tr>
    </table>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// The col itself was styled with background, color, font-weight, and padding.
// We check what actually reached the real cells in that column by reading
// getComputedStyle() on the cells themselves, not on the <col>.
const table = document.getElementById('demoTable') as HTMLTableElement;
const targetCell = table.rows[1].cells[1] as HTMLTableCellElement; // "Row 1 B"
const styles = getComputedStyle(targetCell);

output.textContent =
  \`Properties set on <col id="styledCol">: background, color, font-weight, padding\\n\\n\` +
  \`Computed on the actual <td> cell in that column:\\n\` +
  \`  background-color: \${styles.backgroundColor}   ← reflects the col's background (SUPPORTED)\\n\` +
  \`  color:            \${styles.color}   ← default black, NOT the col's red (unsupported)\\n\` +
  \`  font-weight:       \${styles.fontWeight}   ← default 400, NOT bold (unsupported)\\n\` +
  \`  padding-top:       \${styles.paddingTop}   ← default cell padding, NOT the col's 2rem (unsupported)\\n\`;
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The styled <code>&lt;col&gt;</code> above sets <code>background</code>, <code>color</code>, <code>font-weight</code>, AND <code>padding</code>. Before reading the code, predict: which of those four will actually show up visually on the "Styled column" cells?',
    hint: 'The main page lists exactly four CSS properties that apply to col: background, border, visibility, width. Everything else set on a col is parsed without error but has no effect anywhere.',
    solution: `Only background actually shows up. color, font-weight, and padding are silently ignored — there's
no error or warning, they simply never reach the cells' rendered boxes. This matches the exact list
the main page states applies to col: background, border, visibility, width — nothing else, no matter
how "normal" the CSS property otherwise is.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Styling a <code>&lt;col&gt;</code> works like styling any other element — whatever CSS you apply will show up on the cells in that column.',
      reality: 'Only <code>background</code>, <code>border</code>, <code>visibility</code>, and <code>width</code> actually apply. Every other property is silently accepted by the parser but has zero visual effect.'
    },
    {
      thought: 'If a CSS property has no effect on an element, the browser will usually warn about it in the console.',
      reality: 'There is no warning for unsupported <code>&lt;col&gt;</code> properties — the CSS is completely valid syntax, it simply targets an element that never gets its own rendered box for most properties.'
    },
    {
      thought: 'Checking <code>getComputedStyle()</code> on the <code>&lt;col&gt;</code> element itself tells you what actually rendered.',
      reality: '<code>getComputedStyle()</code> on a <code>&lt;col&gt;</code> reports the CSS values you SET, regardless of whether they had any visual effect. You must check the actual <code>&lt;td&gt;</code>/<code>&lt;th&gt;</code> cells in that column to see what really reached the render.'
    },
  ];
}
