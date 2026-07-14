import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-table-layout-fixed-sizes-columns-from-first-row',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './table-layout-fixed-sizes-columns-from-first-row.html',
  styleUrl: './table-layout-fixed-sizes-columns-from-first-row.scss'
})
export class TableLayoutFixedSizesColumnsFromFirstRowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The default algorithm measures every cell in every row before drawing anything',
      points: [
        'The default <code>table-layout: auto</code> algorithm cannot start rendering column widths until it has examined the content of every cell in every row — a genuinely wide word or long string anywhere in the table can widen its column, no matter which row it is in.',
        'The main page\'s own performance Q&amp;A calls this out directly: "Large tables (1000+ rows) cause slow layout because the browser must measure every cell to calculate column widths." This full-table measurement is the actual cost.',
      ]
    },
    {
      heading: 'table-layout: fixed skips all of that — using only the first row (or explicit widths)',
      points: [
        'With <code>table-layout: fixed</code>, the browser determines every column\'s width using ONLY the first row of cells (or explicit <code>&lt;col&gt;</code>/CSS widths, if present) — it never looks at row 2, row 1000, or any other row\'s content to decide column widths.',
        'This is precisely the optimization the main page recommends: "table-layout: fixed (use first-row widths, no measurement of all cells)." The tradeoff is that content in later rows that doesn\'t fit the first row\'s width will wrap or overflow — the column will NOT grow to accommodate it, unlike the default algorithm.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>table-layout: auto vs fixed</title>
    <style>
      table { border-collapse: collapse; width: 400px; margin-bottom: 1.5rem; }
      td, th { border: 1px solid #999; padding: 0.5rem 0.75rem; }
      #autoTable { table-layout: auto; }
      #fixedTable { table-layout: fixed; }
    </style>
  </head>
  <body>
    <h3>table-layout: auto (default) — measures every row</h3>
    <table id="autoTable">
      <tr><td>short</td><td>short</td></tr>
      <tr><td>alsoshort</td><td>thisisaveryveryverylongsinglewordwithnospacesatall</td></tr>
    </table>

    <h3>table-layout: fixed — uses row 1's widths only</h3>
    <table id="fixedTable">
      <tr><td>short</td><td>short</td></tr>
      <tr><td>alsoshort</td><td>thisisaveryveryverylongsinglewordwithnospacesatall</td></tr>
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

function secondColumnWidth(tableId: string): number {
  const table = document.getElementById(tableId) as HTMLTableElement;
  // The second cell of row 0 represents "column 2" for both tables.
  const cell = table.rows[0].cells[1];
  return Math.round(cell.getBoundingClientRect().width);
}

window.addEventListener('load', () => {
  const autoWidth = secondColumnWidth('autoTable');
  const fixedWidth = secondColumnWidth('fixedTable');

  output.textContent =
    \`autoTable column 2 width:  \${autoWidth}px  (widened to fit the long word in row 2)\\n\` +
    \`fixedTable column 2 width: \${fixedWidth}px  (locked to what row 1 alone needed — long word overflows/wraps instead)\\n\\n\` +
    (autoWidth > fixedWidth
      ? 'Confirmed: auto grew wider than fixed, purely because of content the FIXED\\nlayout never even looked at.'
      : 'Widths matched in this run — try a longer unbroken word in row 2 to see the gap widen.');
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The long word in row 2 has no spaces, so it can\'t wrap onto multiple lines within a narrow column. Predict: in the <code>fixedTable</code>, does that long word get cut off, overflow visibly past the column\'s border, or force the column to grow anyway despite <code>table-layout: fixed</code>?',
    hint: 'table-layout: fixed genuinely never re-measures column widths based on later-row content — the column width decision, once made from row 1, does not change no matter what shows up afterward.',
    solution: `It overflows visibly past the column's border (by default, table cells don't clip content —
you'd need explicit overflow: hidden or word-break: break-all to contain it). The column itself does
NOT grow — table-layout: fixed's whole point is that column widths are locked in from row 1 and never
revisited, which is exactly the performance win (no need to inspect every row) and exactly the visual
tradeoff (long content in later rows can visually overflow rather than reflowing the table).`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'table-layout: fixed just means the table\'s overall width is fixed — individual columns still size themselves to their content as usual.',
      reality: 'It changes HOW EVERY COLUMN\'S width is calculated, not just the table\'s total width. Every column width is locked in from row 1 (or explicit widths) alone — the "fixed" refers to the layout algorithm itself.'
    },
    {
      thought: 'table-layout: fixed is purely a visual/CSS concern with no real performance impact.',
      reality: 'It genuinely changes an O(all cells) measurement pass into an O(first row) one — the main page cites this directly as the recommended mitigation for slow layout on large (1000+ row) tables.'
    },
    {
      thought: 'If a later row has much longer content than row 1, a fixed-layout table will just clip or truncate it automatically.',
      reality: 'By default it neither clips nor truncates — it overflows visibly past the column boundary. You must add your own overflow/word-break CSS if you want different behavior.'
    },
  ];
}
