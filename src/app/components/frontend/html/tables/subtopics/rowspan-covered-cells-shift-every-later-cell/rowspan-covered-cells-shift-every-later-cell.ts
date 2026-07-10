import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-rowspan-covered-cells-shift-every-later-cell',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './rowspan-covered-cells-shift-every-later-cell.html',
  styleUrl: './rowspan-covered-cells-shift-every-later-cell.scss'
})
export class RowspanCoveredCellsShiftEveryLaterCellSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser fills cells left-to-right, top-to-bottom, blind to overlaps',
      points: [
        'The main page\'s Common Mistake is explicit: leaving the covered cell after a <code>rowspan</code> "breaks the layout." The reason is that the HTML table algorithm has no concept of "this slot is already occupied, skip it" beyond what <code>rowspan</code>/<code>colspan</code> tell it in advance — it simply assigns each <code>&lt;td&gt;</code>/<code>&lt;th&gt;</code> in a row to the next grid column that is not already reserved by a rowspan from an earlier row.',
        'A cell with <code>rowspan="2"</code> in row 1 reserves its own column position in row 2 as well. If row 2\'s markup still contains a <code>&lt;td&gt;</code> at that position, that extra cell does not get discarded — it gets slotted into the NEXT unreserved column instead, one position over from where the header row would suggest.',
      ]
    },
    {
      heading: 'This is a shift, not a silent drop — and DOM cellIndex cannot detect it',
      points: [
        'A very common wrong assumption is that the "extra" cell just gets ignored or dropped. It does not — it renders, just one column further right than it looks like it should be. A subtler trap: <code>HTMLTableRowElement</code>\'s own <code>cells</code> collection and each cell\'s <code>cellIndex</code> only reflect DOM order WITHIN that row — they know nothing about rowspans reserved from earlier rows, so a shifted row can report the exact same <code>cellIndex</code> sequence as a correct one.',
        'Detecting the real, visual grid column requires walking the table yourself and tracking which columns are still reserved by an active rowspan from a previous row — the same "write your own audit" technique used elsewhere in this hub for content-model rules the browser doesn\'t enforce.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>rowspan covered-cell mistake</title>
    <style>
      table { border-collapse: collapse; margin-bottom: 1.5rem; }
      td, th { border: 1px solid #999; padding: 0.5rem 0.75rem; text-align: left; }
    </style>
  </head>
  <body>
    <h3>Correct: covered cell removed from row 2</h3>
    <table id="correctTable">
      <tr><td rowspan="2">Merged</td><td>Row 1 Col B</td><td>Row 1 Col C</td></tr>
      <tr><td>Row 2 Col B</td><td>Row 2 Col C</td></tr>
    </table>

    <h3>Wrong: leftover cell left in row 2</h3>
    <table id="wrongTable">
      <tr><td rowspan="2">Merged</td><td>Row 1 Col B</td><td>Row 1 Col C</td></tr>
      <tr><td>Should be removed</td><td>Row 2 Col B</td><td>Row 2 Col C</td></tr>
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

// Computes the TRUE visual grid column of every cell, accounting for rowspans
// reserved by earlier rows — unlike cell.cellIndex, which only reflects DOM
// order within a single row and knows nothing about earlier-row reservations.
function auditTrueColumns(id: string): string {
  const table = document.getElementById(id) as HTMLTableElement;
  const rows = Array.from(table.rows);
  // blockedUntilRow[col] = the last row index a rowspan from an earlier row still reserves.
  const blockedUntilRow: number[] = [];
  const lines: string[] = [];

  rows.forEach((row, r) => {
    const trueColumns: number[] = [];
    let col = 0;
    for (const cell of Array.from(row.cells)) {
      while (blockedUntilRow[col] !== undefined && blockedUntilRow[col] >= r) col++;
      trueColumns.push(col);
      const rowSpan = (cell as HTMLTableCellElement).rowSpan || 1;
      if (rowSpan > 1) blockedUntilRow[col] = r + rowSpan - 1;
      col++;
    }
    lines.push(\`  row \${r}: cellIndex order = [\${Array.from(row.cells).map(c => c.cellIndex).join(', ')}]   true grid columns = [\${trueColumns.join(', ')}]\`);
  });

  return \`\${id}:\\n\${lines.join('\\n')}\`;
}

output.textContent =
  auditTrueColumns('correctTable') + '\\n\\n' +
  auditTrueColumns('wrongTable') + '\\n\\n' +
  'Both tables report IDENTICAL cellIndex sequences per row — cellIndex cannot see\\n' +
  'the rowspan reservation at all. Only the true-grid-column audit reveals that\\n' +
  'wrongTable\\'s row 1 cells actually land in columns [1, 2, 3] instead of [1, 2] —\\n' +
  'a real, invisible-to-cellIndex shift caused by the one leftover cell.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the "wrong" table above, the merged cell has <code>rowspan="2"</code> and reserves column 0 through row 1 as well. Row 1\'s markup still has 3 <code>&lt;td&gt;</code> elements. Predict: will <code>row.cells.length</code> for the wrong table\'s second row be the same number as the correct table\'s second row, or different?',
    hint: '<code>cells.length</code> just counts how many <code>&lt;td&gt;</code>/<code>&lt;th&gt;</code> elements are literally present in that row\'s markup — it has no awareness of rowspan reservations from a previous row at all.',
    solution: `They're different: correctTable's row 1 has 2 cells (the covered one was properly removed),
while wrongTable's row 1 has 3 (the leftover cell was never removed). But this is exactly why
cells.length — and cellIndex — are unreliable tools for catching this bug on their own: you would
have to already know how many cells row 1 SHOULD have to notice the count is off. The true-grid-column
audit is what makes the shift visible without needing that prior knowledge — it directly computes
where each cell actually lands relative to the columns reserved by earlier rows' rowspans.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If I forget to remove a cell that a <code>rowspan</code> already covers, the browser will just ignore the extra one.',
      reality: 'It renders every cell it finds. The leftover cell lands in the next unreserved column, silently shifting every cell after it — there is no overlap detection or auto-removal.'
    },
    {
      thought: '<code>cell.cellIndex</code> tells you which visual column a table cell is actually in.',
      reality: '<code>cellIndex</code> only reflects a cell\'s position among its OWN row\'s DOM children — it has no knowledge of rowspans reserved by earlier rows, so it cannot detect this exact class of shift at all.'
    },
    {
      thought: '<code>rowspan</code> and <code>colspan</code> automatically manage which cells belong to which columns for you, the way CSS Grid\'s auto-placement does.',
      reality: 'HTML tables have no auto-placement algorithm remotely like CSS Grid\'s. The author is entirely responsible for manually omitting every cell that a span already covers — get it wrong and the table silently misaligns.'
    },
  ];
}
