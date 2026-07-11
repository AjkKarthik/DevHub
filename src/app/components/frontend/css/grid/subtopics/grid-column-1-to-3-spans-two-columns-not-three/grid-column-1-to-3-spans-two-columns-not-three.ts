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
  templateUrl: './grid-column-1-to-3-spans-two-columns-not-three.html',
  styleUrl: './grid-column-1-to-3-spans-two-columns-not-three.scss'
})
export class GridColumn1To3SpansTwoColumnsNotThreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'grid-column: 1 / 3 names GRID LINES, not a count of columns — a genuinely easy off-by-one trap',
      points: [
        'An N-column grid has N+1 grid lines, numbered starting from 1. A 3-column grid has lines 1, 2, 3, AND 4 — one more line than the number of columns.',
        '<code>grid-column: 1 / 3</code> spans from line 1 to line 3 — which is only the FIRST TWO columns (the space between lines 1-2 and 2-3), not all three. To span all three columns, the end line needs to be 4: <code>grid-column: 1 / 4</code>.',
      ]
    },
    {
      heading: 'This is directly measurable by rendered width, and grid-column: 1 / -1 sidesteps the counting problem entirely',
      points: [
        'In a 300px-wide, 3-equal-column grid, an item with <code>grid-column: 1 / 3</code> renders at exactly 200px (2 of the 3 columns) — not 300px, confirming it really only spans two of the three tracks.',
        '<code>-1</code> always refers to the LAST grid line, regardless of how many columns the grid has — <code>grid-column: 1 / -1</code> reliably spans the full width of any grid, without needing to count columns and add one.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>grid-column line numbers vs column counts</title>
    <style>
      #grid { display: grid; grid-template-columns: repeat(3, 1fr); width: 300px; }
      #span13 { grid-column: 1 / 3; height: 30px; background: #dbeafe; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="grid">
      <div id="span13">grid-column: 1 / 3</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const span13 = document.querySelector<HTMLElement>('#span13')!;

const actualWidth = span13.getBoundingClientRect().width;
const fullGridWidth = 300;
const twoOfThreeColumns = (fullGridWidth / 3) * 2;

console.log('grid is 300px wide, 3 equal columns (100px each)');
console.log('grid-column: 1 / 3 actual rendered width:', actualWidth);
console.log('expected if it spanned all 3 columns:', fullGridWidth);
console.log('expected if it spans only 2 of 3 columns:', twoOfThreeColumns);
console.log('it only spans 2 columns, not 3:', Math.abs(actualWidth - twoOfThreeColumns) < 1);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A grid has <code>grid-template-columns: repeat(4, 1fr)</code>. An item has <code>grid-column: 1 / 3</code>. How many of the 4 columns does it actually span?',
    hint: 'Count the grid LINES involved (1 and 3), not the number written in the second position — the span is the gap BETWEEN those two line numbers.',
    solution: 'Only 2 columns — lines 1 to 3 covers exactly the first two column tracks (line1→line2 is column 1, line2→line3 is column 2). To span all 4 columns in this grid, it would need <code>grid-column: 1 / 5</code> or, more reliably, <code>grid-column: 1 / -1</code>.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'grid-column: 1 / 3 means "span 3 columns starting from column 1" — the second number is a column count.',
      reality: 'Both numbers in grid-column are LINE numbers, not counts. 1 / 3 spans the gap between line 1 and line 3, which is exactly 2 columns — the second number is one MORE than the column count you might expect.'
    },
    {
      thought: 'An N-column grid has N grid lines, matching the number of columns.',
      reality: 'It has N+1 lines — one more than the column count, since each column needs a line on both its left and right edge, and adjacent columns share a line. A 3-column grid has lines 1 through 4.'
    },
    {
      thought: 'Spanning "the full width" of a grid always requires knowing and writing the exact number of columns as the end line.',
      reality: 'grid-column: 1 / -1 avoids this entirely — -1 always refers to the LAST line regardless of column count, so it reliably spans the full grid without needing to count columns or update the value if the column count later changes.'
    }
  ];
}
