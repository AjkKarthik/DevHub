import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  selector: 'app-html-tables',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './tables.html',
  styleUrl: './tables.scss'
})
export class HtmlTables {

  quickRef: QuickRefItem[] = [
    { name: '<table>', type: 'keyword', desc: 'Root table element — wraps all table content' },
    { name: '<caption>', type: 'keyword', desc: 'Visible table title — first child of table; improves accessibility' },
    { name: '<thead>', type: 'keyword', desc: 'Header row group — helps screen readers and sticky-header CSS' },
    { name: '<tbody>', type: 'keyword', desc: 'Body row group — main data rows; browser creates one implicitly' },
    { name: '<tfoot>', type: 'keyword', desc: 'Footer row group — totals, summary rows' },
    { name: '<tr>', type: 'keyword', desc: 'Table row — contains td or th cells' },
    { name: '<th scope="col|row">', type: 'keyword', desc: 'Header cell — bold by default; scope associates it with col/row' },
    { name: '<td>', type: 'keyword', desc: 'Data cell — regular table cell' },
    { name: 'colspan / rowspan', type: 'keyword', desc: 'Merge cells horizontally / vertically across n columns or rows' },
    { name: 'scope="col"', type: 'keyword', desc: 'Associates a th with its column — required for accessible column headers' },
    { name: 'scope="row"', type: 'keyword', desc: 'Associates a th with its row — for row headers in the first column' },
    { name: '<colgroup> / <col>', type: 'keyword', desc: 'Apply CSS to entire columns without touching each td' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'When to use tables',
      points: [
        'Tables are for <strong>tabular data</strong> — information with a two-dimensional relationship between rows and columns.',
        'Good use cases: pricing plans, financial data, comparison matrices, sports standings, schedule grids.',
        '<strong>Never use tables for page layout.</strong> Historically developers used table-based layouts, but this breaks accessibility, is hard to make responsive, and is semantically wrong. Use CSS Grid or Flexbox for layout.',
        'If the data makes sense in a spreadsheet — it probably belongs in a <code>&lt;table&gt;</code>. If it\'s a visual arrangement of unrelated content — use CSS layout.',
      ]
    },
    {
      heading: 'Table structure and accessibility',
      points: [
        '<code>&lt;caption&gt;</code> — the table\'s title, displayed above (or below with CSS). Screen readers announce it before reading the table, helping users understand the context.',
        '<code>&lt;thead&gt;</code>, <code>&lt;tbody&gt;</code>, <code>&lt;tfoot&gt;</code> — section the table. Not required but important for accessibility, sticky CSS headers, and browser print behaviour (thead/tfoot repeat on each page).',
        '<code>&lt;th scope="col"&gt;</code> marks a column header. <code>&lt;th scope="row"&gt;</code> marks a row header. Screen readers use scope to announce "Product: Laptop" instead of just "Laptop" when reading cells.',
        'For complex tables with merged cells, use <code>id</code> on headers and <code>headers="id1 id2"</code> on cells to explicitly map every cell to its column and row headers.',
      ]
    },
    {
      heading: 'colspan and rowspan',
      points: [
        '<code>colspan="n"</code> makes a cell span n columns horizontally. Remove the cells it would overlap — the layout breaks if you leave them in.',
        '<code>rowspan="n"</code> makes a cell span n rows vertically. Same rule: remove the covered cells from the rows below.',
        'A common pattern: a spanning header in <code>&lt;thead&gt;</code> covering a sub-group of columns, with individual column headers below it.',
        'Accessibility warning: heavily merged tables are confusing for screen readers even with correct scope attributes. Prefer simple flat tables when possible.',
      ]
    },
    {
      heading: 'colgroup and styling columns',
      points: [
        '<code>&lt;colgroup&gt;</code> with <code>&lt;col&gt;</code> elements lets you apply CSS to entire columns via the <code>span</code> attribute.',
        'Only a subset of CSS properties apply to <code>&lt;col&gt;</code>: <code>background</code>, <code>border</code>, <code>visibility</code>, <code>width</code>.',
        '<code>&lt;col span="2" style="background:lightblue"&gt;</code> highlights every cell in columns 3 and 4.',
        'Useful for visually distinguishing alternating column groups or highlighting a specific column (e.g. the "recommended" plan column in a pricing table).',
      ]
    },
    {
      heading: 'Responsive tables',
      points: [
        'Tables do not reflow by default — on narrow screens, they overflow horizontally. Wrap in a <code>&lt;div style="overflow-x:auto"&gt;</code> to let users scroll without breaking the layout.',
        'An alternative is the "card layout" technique: with CSS, hide the column headers and display each row as a card using <code>data-label</code> attributes on each <code>&lt;td&gt;</code>.',
        'For very data-heavy tables, consider a horizontal scroll wrapper as a pragmatic fix rather than trying to re-layout the table at mobile widths.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic accessible table',
      language: 'html',
      code: `<table>
  <caption>Q1 2025 Revenue by Product</caption>

  <thead>
    <tr>
      <th scope="col">Product</th>
      <th scope="col">Jan</th>
      <th scope="col">Feb</th>
      <th scope="col">Mar</th>
      <th scope="col">Total</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <th scope="row">Widget A</th>
      <td>$1,200</td>
      <td>$1,450</td>
      <td>$1,600</td>
      <td>$4,250</td>
    </tr>
    <tr>
      <th scope="row">Widget B</th>
      <td>$800</td>
      <td>$950</td>
      <td>$1,100</td>
      <td>$2,850</td>
    </tr>
  </tbody>

  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td>$2,000</td>
      <td>$2,400</td>
      <td>$2,700</td>
      <td><strong>$7,100</strong></td>
    </tr>
  </tfoot>
</table>`
    },
    {
      label: 'colspan & rowspan',
      language: 'html',
      code: `<table>
  <caption>Course Schedule</caption>

  <thead>
    <tr>
      <!-- This th spans 2 columns: Mon and Tue -->
      <th scope="col">Time</th>
      <th scope="colgroup" colspan="2">Monday–Tuesday</th>
      <th scope="colgroup" colspan="2">Wednesday–Thursday</th>
    </tr>
    <tr>
      <th scope="col">Slot</th>
      <th scope="col">Mon</th>
      <th scope="col">Tue</th>
      <th scope="col">Wed</th>
      <th scope="col">Thu</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <th scope="row">09:00</th>
      <td>HTML</td>
      <!-- This td spans 2 rows (09:00 and 10:00) on Tuesday -->
      <td rowspan="2">Long CSS Lab</td>
      <td>JavaScript</td>
      <td>React</td>
    </tr>
    <tr>
      <th scope="row">10:00</th>
      <td>Accessibility</td>
      <!-- No Tue cell here — covered by rowspan above -->
      <td>Node.js</td>
      <td>Testing</td>
    </tr>
  </tbody>
</table>`
    },
    {
      label: 'Responsive wrapper',
      language: 'html',
      code: `<!-- Horizontal scroll wrapper for wide tables on mobile -->
<div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
  <table style="min-width: 600px;">
    <caption>Comparison: Free vs Pro vs Enterprise</caption>
    <thead>
      <tr>
        <th scope="col">Feature</th>
        <th scope="col">Free</th>
        <th scope="col">Pro</th>
        <th scope="col">Enterprise</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Projects</th>
        <td>3</td>
        <td>Unlimited</td>
        <td>Unlimited</td>
      </tr>
      <tr>
        <th scope="row">Team members</th>
        <td>1</td>
        <td>10</td>
        <td>Unlimited</td>
      </tr>
      <tr>
        <th scope="row">Support</th>
        <td>Community</td>
        <td>Email</td>
        <td>24/7 phone</td>
      </tr>
    </tbody>
  </table>
</div>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using tables for page layout',
      wrong: `<table>
  <tr>
    <td class="sidebar">Nav links</td>
    <td class="content">Main article</td>
  </tr>
</table>`,
      right: `<div style="display: grid; grid-template-columns: 200px 1fr;">
  <nav>Nav links</nav>
  <main>Main article</main>
</div>`,
      explanation: 'Tables for layout are semantically wrong (announces as "table" to screen readers), hard to make responsive, and harder to style than CSS Grid/Flexbox.'
    },
    {
      title: 'Missing scope on th elements',
      wrong: `<thead>
  <tr>
    <th>Product</th>
    <th>Price</th>
  </tr>
</thead>`,
      right: `<thead>
  <tr>
    <th scope="col">Product</th>
    <th scope="col">Price</th>
  </tr>
</thead>`,
      explanation: 'Without scope, screen readers cannot reliably associate header cells with their data cells. Add scope="col" for column headers and scope="row" for row headers.'
    },
    {
      title: 'Leaving covered cells after rowspan',
      wrong: `<tr>
  <td rowspan="2">Merged</td>
  <td>Row 1</td>
</tr>
<tr>
  <td>Should be removed</td>  <!-- extra cell breaks layout -->
  <td>Row 2</td>
</tr>`,
      right: `<tr>
  <td rowspan="2">Merged</td>
  <td>Row 1</td>
</tr>
<tr>
  <!-- no extra cell here — covered by rowspan -->
  <td>Row 2</td>
</tr>`,
      explanation: 'rowspan="2" makes the cell occupy 2 rows. If you keep the covered cell in the second row, the table has too many cells and the layout shifts.'
    },
    {
      title: 'No caption on a data table',
      wrong: `<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>`,
      right: `<table>
  <caption>Monthly revenue by product category — Q1 2025</caption>
  <thead>...</thead>
  <tbody>...</tbody>
</table>`,
      explanation: '<caption> is the first element screen readers announce. Without it, users hear "table, 5 columns, 12 rows" with no context. It also serves as a visible heading.'
    },
    {
      title: 'Tables without overflow wrapper on mobile',
      wrong: `<table><!-- wide table with 8 columns --></table>`,
      right: `<div style="overflow-x: auto;">
  <table><!-- wide table with 8 columns --></table>
</div>`,
      explanation: 'Wide tables overflow the viewport on mobile, breaking the page layout. A scroll wrapper lets users pan horizontally while the rest of the page stays fixed.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an accessible pricing comparison table',
    language: 'html',
    description: `Build a pricing comparison table with the following structure:

- Caption: "Plan comparison — 2025 pricing"
- 4 columns: Feature, Free, Pro ($9/mo), Enterprise (custom)
- Grouped header: a spanning th "Paid plans" covers Pro and Enterprise
- 5 feature rows with row headers (th scope="row"):
  1. Projects: 3 / Unlimited / Unlimited
  2. Team members: 1 / 10 / Unlimited
  3. Storage: 500 MB / 10 GB / 1 TB
  4. Analytics: Basic / Advanced / Custom
  5. Support: Community / Email / 24/7 phone
- A footer row: "Best for": Individuals / Small teams / Organisations

All column and row headers must have correct scope attributes.`,
    hints: [
      'The grouping header row needs two tr elements in thead',
      'scope="colgroup" on the "Paid plans" th, colspan="2" to span Pro and Enterprise',
      'scope="row" on the first cell in each tbody and tfoot row',
      'The footer row spans the full width — use tfoot with a th scope="row" and td for each plan',
      'Wrap the whole table in a div with overflow-x: auto for mobile'
    ],
    starterCode: `<div style="overflow-x: auto;">
  <table>
    <!-- Add caption, thead, tbody, tfoot here -->
  </table>
</div>`,
    solution: `<div style="overflow-x: auto;">
  <table>
    <caption>Plan comparison — 2025 pricing</caption>

    <thead>
      <tr>
        <th scope="col" rowspan="2">Feature</th>
        <th scope="col" rowspan="2">Free</th>
        <th scope="colgroup" colspan="2">Paid plans</th>
      </tr>
      <tr>
        <th scope="col">Pro ($9/mo)</th>
        <th scope="col">Enterprise (custom)</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <th scope="row">Projects</th>
        <td>3</td><td>Unlimited</td><td>Unlimited</td>
      </tr>
      <tr>
        <th scope="row">Team members</th>
        <td>1</td><td>10</td><td>Unlimited</td>
      </tr>
      <tr>
        <th scope="row">Storage</th>
        <td>500 MB</td><td>10 GB</td><td>1 TB</td>
      </tr>
      <tr>
        <th scope="row">Analytics</th>
        <td>Basic</td><td>Advanced</td><td>Custom</td>
      </tr>
      <tr>
        <th scope="row">Support</th>
        <td>Community</td><td>Email</td><td>24/7 phone</td>
      </tr>
    </tbody>

    <tfoot>
      <tr>
        <th scope="row">Best for</th>
        <td>Individuals</td>
        <td>Small teams</td>
        <td>Organisations</td>
      </tr>
    </tfoot>
  </table>
</div>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When is it appropriate to use an HTML <table>?',
      options: [
        'For any multi-column page layout',
        'For tabular data with a two-dimensional relationship between rows and columns',
        'Whenever you need data to line up vertically',
        'For navigation menus with multiple items'
      ],
      answer: 1,
      explanation: 'Tables are for tabular data — spreadsheet-like information. Using them for layout is semantically wrong and creates accessibility problems.'
    },
    {
      q: 'Which scope value should a column header <th> have?',
      options: ['scope="column"', 'scope="col"', 'scope="header"', 'scope="th"'],
      answer: 1,
      explanation: 'scope="col" associates the th with all cells in its column. scope="row" associates it with all cells in its row. These allow screen readers to announce headers when reading cells.'
    },
    {
      q: 'What must you do after applying rowspan="2" to a cell?',
      options: [
        'Add rowspan="0" to the cell below',
        'Remove the cell that would otherwise occupy that space in the row below',
        'Add a placeholder td with no content',
        'Add scope="rowgroup" to the spanning cell'
      ],
      answer: 1,
      explanation: 'rowspan="2" makes the cell occupy two rows. The row below must NOT have a td for that column position — if it does, the table has too many cells and the layout breaks.'
    },
    {
      q: 'Which element provides a visible, accessible title for a table?',
      options: ['<h2> above the table', '<caption>', '<th colspan="5">', '<thead><tr><td>'],
      answer: 1,
      explanation: '<caption> is the semantic title element for a table. Screen readers announce it first. It appears inside <table>, unlike an h2 which would be a separate element.'
    },
    {
      q: 'How do you handle wide tables on small screens?',
      options: [
        'Set table { width: 100% }',
        'Wrap the table in a div with overflow-x: auto',
        'Use colspan to reduce columns',
        'Add display: flex to the table'
      ],
      answer: 1,
      explanation: 'overflow-x: auto on a wrapper div allows horizontal scrolling for wide tables without breaking the surrounding page layout. Setting width: 100% forces the table to compress, breaking cell content.'
    },
    {
      q: 'What does the caption element do in a table?',
      options: ['Adds a footer row', 'Provides a visible title and accessible description for the table', 'Replaces the <th> header row', 'Only affects screen readers, not visual output'],
      answer: 1,
      explanation: '<caption> must be the first child of <table>. It provides a visible title above the table and also serves as the table\'s accessible name for screen readers (equivalent to aria-label). A table without a caption or aria-label has no name in the accessibility tree.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is it okay to skip <thead> and <tbody> and just use <tr> directly inside <table>?',
      a: 'Technically yes — browsers create an implicit <tbody> for bare <tr> elements. But explicit <thead>/<tbody>/<tfoot> sections are best practice: they enable sticky CSS headers, allow browsers to repeat headers when printing multi-page tables, and make the structure clearer for screen readers and developers.'
    },
    {
      q: 'What is the difference between <th> and <td>?',
      a: '<th> (table header) is a header cell — bold and centered by default, and announced as a header by screen readers. <td> (table data) is a regular data cell. Always use <th> for row and column headers; use scope to associate them with their cells.'
    },
    {
      q: 'Can I use CSS to style alternate column backgrounds?',
      a: 'Yes, via <colgroup>/<col> — set background on a <col> element to highlight every cell in that column. Alternatively, CSS :nth-child(even) on td/th targets alternating cells. <colgroup> is simpler for whole-column styling; :nth-child is more flexible.'
    },
    {
      q: 'My table has 10 columns. How do I make it accessible for screen readers?',
      a: 'For simple tables: scope="col" on all column headers and scope="row" on all row headers is sufficient. For complex tables with merged cells: add id attributes to header cells and reference them from data cells with headers="id1 id2". Consider whether a simpler table structure (or multiple tables) would serve users better.'
    },
    {
      q: 'How do you make a sortable table accessible?',
      a: 'Add aria-sort to the currently sorted column header: "ascending", "descending", or "none". Set it to "other" if the sort order is non-standard. Mark unsorted columns with aria-sort="none" so users know sorting is available. Make sort buttons keyboard-focusable and announce the new order with an ARIA live region after sorting: "Sorted by Name, ascending."',
    },
    {
      q: 'What is the performance cost of large HTML tables and how do you mitigate it?',
      a: 'Large tables (1000+ rows) cause slow layout because the browser must measure every cell to calculate column widths. Mitigate with table-layout: fixed (use first-row widths, no measurement of all cells) and width: 100% on the table. For very large data sets, implement virtual scrolling — render only visible rows in the DOM and replace them as the user scrolls. This keeps the DOM small regardless of data size.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTML tables present tabular data — two-dimensional relationships between rows and columns — never layout.',
    mustKnow: [
      '<caption> is the table\'s title — first child of <table>, announced by screen readers',
      'scope="col" on column headers, scope="row" on row headers — required for accessibility',
      'colspan merges cells horizontally; rowspan vertically — remove the covered cells',
      'thead/tbody/tfoot section the table — enables sticky headers and print repetition',
      'Never use tables for page layout — use CSS Grid or Flexbox',
      'Wide tables need an overflow-x: auto wrapper for mobile responsiveness',
    ],
    interviewFocus: [
      'Why tables should not be used for layout — semantics and accessibility',
      'scope attribute values and why they matter for screen readers',
      'How colspan and rowspan work and the "remove covered cells" rule',
      'How to make a wide table responsive on mobile',
    ]
  };
}