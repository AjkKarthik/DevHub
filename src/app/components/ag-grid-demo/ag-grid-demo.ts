import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi, themeQuartz } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  salary: number;
  active: boolean;
}

const EMPLOYEES: Employee[] = [
  { id: 1,  name: 'Alice Johnson',  role: 'Frontend Lead',    department: 'Engineering', salary: 115000, active: true },
  { id: 2,  name: 'Bob Smith',      role: 'Backend Dev',      department: 'Engineering', salary: 98000,  active: true },
  { id: 3,  name: 'Carol White',    role: 'UX Designer',      department: 'Design',      salary: 85000,  active: true },
  { id: 4,  name: 'David Brown',    role: 'Product Manager',  department: 'Product',     salary: 110000, active: false },
  { id: 5,  name: 'Eva Martinez',   role: 'DevOps Engineer',  department: 'Engineering', salary: 105000, active: true },
  { id: 6,  name: 'Frank Lee',      role: 'QA Engineer',      department: 'Engineering', salary: 78000,  active: true },
  { id: 7,  name: 'Grace Kim',      role: 'Data Scientist',   department: 'Analytics',   salary: 120000, active: true },
  { id: 8,  name: 'Henry Clark',    role: 'Scrum Master',     department: 'Product',     salary: 92000,  active: false },
  { id: 9,  name: 'Isla Thompson',  role: 'Angular Developer',department: 'Engineering', salary: 108000, active: true },
  { id: 10, name: 'Jack Wilson',    role: 'Tech Lead',        department: 'Engineering', salary: 130000, active: true },
];

@Component({
  selector: 'app-ag-grid-demo',
  imports: [AgGridAngular, FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './ag-grid-demo.html',
  styleUrl: './ag-grid-demo.scss',
})
export class AgGridDemo {
  private gridApi!: GridApi<Employee>;

  theme = themeQuartz;
  rowData = signal<Employee[]>(EMPLOYEES);
  selectedCount = signal(0);
  quickFilter = signal('');

  columnDefs: ColDef<Employee>[] = [
    { field: 'id',         headerName: '#',          width: 70,  sortable: true },
    { field: 'name',       headerName: 'Name',       flex: 1,    sortable: true, filter: true },
    { field: 'role',       headerName: 'Role',       flex: 1,    sortable: true, filter: true },
    { field: 'department', headerName: 'Dept',       width: 130, sortable: true, filter: true },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      sortable: true,
      valueFormatter: p => p.value ? `$${p.value.toLocaleString()}` : '',
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p: { value: boolean }) =>
        p.value
          ? `<span style="color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Active</span>`
          : `<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:4px;font-size:.8rem;">Inactive</span>`,
    },
  ];

  defaultColDef: ColDef = { resizable: true };

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  onSelectionChanged() {
    this.selectedCount.set(this.gridApi?.getSelectedRows().length ?? 0);
  }

  exportCsv() { this.gridApi?.exportDataAsCsv(); }

  applyFilter(val: string) {
    this.quickFilter.set(val);
    this.gridApi?.setGridOption('quickFilterText', val);
  }

  qna: QnaItem[] = [
    { q: 'How do you get the AG Grid API instance in Angular?', a: 'Listen to the <code>(gridReady)="onGridReady($event)"</code> event. The event carries <code>event.api</code> — store it: <code>this.gridApi = event.api</code>. Use it to call methods like <code>gridApi.exportDataAsCsv()</code>.' },
    { q: 'How do you trigger a grid refresh after data changes?', a: 'Always pass a <strong>new array reference</strong> to <code>rowData</code>: <code>this.rows = [...this.rows, newRow]</code>. AG Grid detects the reference change and re-renders. Mutating the existing array does not trigger a refresh.' },
    { q: 'What is a cell renderer in AG Grid?', a: 'A cell renderer is a function or component that returns custom HTML for a cell. Use it for clickable links, status badges, or progress bars: <code>cellRenderer: (params) => `&lt;strong&gt;${params.value}&lt;/strong&gt;`</code>.' },
    { q: 'How do you enable sorting and filtering in AG Grid?', a: 'Set <code>sortable: true</code> and <code>filter: true</code> on each <code>ColDef</code>, or set them in <code>defaultColDef</code> to apply globally. Click column headers to sort; click the filter icon to filter.' },
    { q: 'How do you export grid data to CSV?', a: '<code>gridApi.exportDataAsCsv({ fileName: \'data.csv\', columnKeys: [\'name\', \'age\'] })</code>. AG Grid builds the CSV from the current filtered/sorted view and triggers a browser download — no server needed.' },
    { q: 'What is themeQuartz and how is it applied?', a: '<code>import { themeQuartz } from \'ag-grid-community\'</code>. Pass <code>[theme]="themeQuartz"</code> to <code>&lt;ag-grid-angular&gt;</code>. This is the new CSS-in-JS theming system in AG Grid 31+ — replaces CSS class-based themes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'AG Grid core concepts',
      points: [
        '<code>rowData</code>: the array of row objects. <code>columnDefs</code>: array of <code>ColDef</code> objects defining columns.',
        '<code>defaultColDef</code>: shared settings applied to every column (sortable, resizable, filter, etc.).',
        '<code>GridApi</code> is obtained from the <code>(gridReady)</code> event — use it for imperative operations.',
        'AG Grid is framework-agnostic; <code>ag-grid-angular</code> is a thin wrapper that translates Angular inputs to the core grid.',
      ],
    },
    {
      heading: 'Column definitions',
      points: [
        '<code>field: \'name\'</code> maps to the key in each row object. <code>headerName</code> sets the visible column header.',
        '<code>valueFormatter</code>: transform the raw value for display (e.g. currency formatting) without changing the data.',
        '<code>cellRenderer</code>: a function or component that returns HTML for the entire cell — for badges, buttons, icons.',
        '<code>filter: true</code> adds a column filter. <code>sortable: true</code> enables header-click sorting.',
      ],
    },
    {
      heading: 'Selection & actions',
      points: [
        '<code>rowSelection="multiple"</code> enables multi-row selection with checkboxes.',
        '<code>gridApi.getSelectedRows()</code> returns the currently selected row objects.',
        '<code>gridApi.setGridOption(\'quickFilterText\', value)</code> applies a global text filter across all columns.',
        '<code>gridApi.exportDataAsCsv()</code> triggers a CSV download — no extra libraries needed.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'AG Grid community edition is free. Enterprise features (grouping, pivot, server-side row model) require a licence.',
        'Use <code>themeQuartz</code> (built-in) for a modern look without importing a CSS file manually.',
        'Mutating <code>rowData</code> in place does NOT trigger a grid refresh — always pass a new array reference to <code>signal()</code>.',
        'For large datasets use Server-Side Row Model (<code>serverSideRowModel</code>) to fetch pages on demand.',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'In the AgGridDemo component, how is the GridApi instance obtained and stored?', options: ['By injecting GridApi via Angular\'s dependency injection system', 'By listening to the (gridReady) event and storing event.api', 'By calling AgGridAngular.getApi() after view initialization', 'By declaring a @ViewChild(AgGridAngular) reference'], answer: 1, explanation: 'The component listens to (gridReady)="onGridReady($event)" on the ag-grid-angular element. Inside onGridReady, it stores the API: this.gridApi = event.api. This is the standard AG Grid pattern for accessing imperative grid operations.' },
    { q: 'What is the difference between valueFormatter and cellRenderer in an AG Grid ColDef?', options: ['valueFormatter changes the underlying data model; cellRenderer only changes display', 'valueFormatter transforms the display value as a string; cellRenderer returns full HTML for the cell', 'valueFormatter applies to the entire row; cellRenderer applies only to a single cell', 'They are interchangeable — both return an HTML string for the cell'], answer: 1, explanation: 'valueFormatter transforms the raw value into a display string without affecting the data (used for the salary column: p => `$${p.value.toLocaleString()}`). cellRenderer returns a full HTML string or component for the cell, allowing richer output like the colored Active/Inactive badges on the active column.' },
    { q: 'Why does the rowData binding in the template use rowData() instead of just rowData?', options: ['Because AG Grid requires a function call to trigger change detection', 'Because rowData is an Angular Signal and must be invoked to read its current value', 'Because rowData is an async observable that needs to be unwrapped', 'Because the HTML template cannot access class properties directly'], answer: 1, explanation: 'rowData is declared as rowData = signal<Employee[]>(EMPLOYEES). Angular Signals are functions — you call them with () to read the current value. In the template, [rowData]="rowData()" passes the unwrapped array to the grid.' },
    { q: 'What does calling this.gridApi.setGridOption(\'quickFilterText\', val) accomplish?', options: ['It filters only the currently visible column based on val', 'It applies a global text filter that searches across all column values simultaneously', 'It permanently removes rows that do not match val from rowData', 'It sorts all columns alphabetically by val'], answer: 1, explanation: 'The quickFilterText grid option applies a global search across every column in the grid. Any row where at least one cell value matches the text is shown. This is why the applyFilter method updates both the signal and calls setGridOption — the signal tracks the value for the template while setGridOption drives the grid itself.' },
    { q: 'Which of the following ColDef properties controls how a column shares available grid width proportionally?', options: ['width: 130', 'flex: 1', 'resizable: true', 'minWidth: 100'], answer: 1, explanation: 'The flex property works like CSS flexbox. Columns with flex: 1 share the remaining width after fixed-width columns are allocated. In the demo, name and role both use flex: 1 so they each take an equal share of the remaining space, while id, department, salary, and active use explicit width values.' },
  ];

  challenge: Challenge = {
    title: 'Add a Custom \'Salary Band\' Column with Cell Renderer',
    description: 'Extend the AG Grid employee table by adding a new computed column called \'Band\' that displays a colored badge based on the employee\'s salary range. Salary < 90000 = \'Junior\' (blue badge), 90000-114999 = \'Mid\' (yellow badge), >= 115000 = \'Senior\' (green badge). Add the column definition to the existing columnDefs array and implement the cellRenderer function.',
    language: 'typescript',
    hints: [
      'Use cellRenderer: (p: { value: number }) => ... on the salary field, or add a brand new ColDef with field: \'salary\' and a different headerName. Alternatively, add a separate entry with no field and use valueGetter.',
      'A valueGetter: (p) => p.data?.salary allows you to compute a value from the row object without requiring a dedicated field on Employee.',
      'Return an HTML string from cellRenderer with inline styles or CSS classes for each band, similar to how the active column renders its Active/Inactive badges.',
      'Add the new ColDef object to the columnDefs array. You do not need to modify the Employee interface or EMPLOYEES data.',
    ],
    starterCode: `// Add a new ColDef entry to the columnDefs array in ag-grid-demo.ts
// The column should display a colored badge indicating salary band:
//   < 90000        => 'Junior'  (blue:   color #1e40af, background #dbeafe)
//   90000-114999   => 'Mid'     (yellow: color #92400e, background #fef3c7)
//   >= 115000      => 'Senior'  (green:  color #166534, background #dcfce7)

// Current columnDefs (partial) — add your new entry:
columnDefs: ColDef<Employee>[] = [
  { field: 'id',         headerName: '#',      width: 70,  sortable: true },
  { field: 'name',       headerName: 'Name',   flex: 1,    sortable: true, filter: true },
  { field: 'role',       headerName: 'Role',   flex: 1,    sortable: true, filter: true },
  { field: 'department', headerName: 'Dept',   width: 130, sortable: true, filter: true },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 120,
    sortable: true,
    valueFormatter: p => p.value ? \`$\${p.value.toLocaleString()}\` : '',
  },
  {
    field: 'active',
    headerName: 'Status',
    width: 100,
    cellRenderer: (p: { value: boolean }) =>
      p.value
        ? \`<span style="color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Active</span>\`
        : \`<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:4px;font-size:.8rem;">Inactive</span>\`,
  },
  // TODO: Add your 'Band' column definition here
];`,
    solution: `// Add the following ColDef to the columnDefs array:

columnDefs: ColDef<Employee>[] = [
  { field: 'id',         headerName: '#',      width: 70,  sortable: true },
  { field: 'name',       headerName: 'Name',   flex: 1,    sortable: true, filter: true },
  { field: 'role',       headerName: 'Role',   flex: 1,    sortable: true, filter: true },
  { field: 'department', headerName: 'Dept',   width: 130, sortable: true, filter: true },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 120,
    sortable: true,
    valueFormatter: p => p.value ? \`$\${p.value.toLocaleString()}\` : '',
  },
  {
    field: 'active',
    headerName: 'Status',
    width: 100,
    cellRenderer: (p: { value: boolean }) =>
      p.value
        ? \`<span style="color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Active</span>\`
        : \`<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:4px;font-size:.8rem;">Inactive</span>\`,
  },
  {
    headerName: 'Band',
    width: 100,
    valueGetter: (p) => p.data?.salary,
    cellRenderer: (p: { value: number }) => {
      if (p.value >= 115000) {
        return \`<span style="color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Senior</span>\`;
      } else if (p.value >= 90000) {
        return \`<span style="color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Mid</span>\`;
      } else {
        return \`<span style="color:#1e40af;background:#dbeafe;padding:2px 8px;border-radius:4px;font-size:.8rem;">Junior</span>\`;
      }
    },
  },
];`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'AgGridAngular', type: 'directive', desc: 'The Angular wrapper component for AG Grid — add it to imports and use <ag-grid-angular> in templates.' , since: '22'},
    { name: 'ColDef', type: 'interface', desc: 'TypeScript interface describing a single column: field, headerName, sortable, filter, valueFormatter, cellRenderer, flex, width, etc.' },
    { name: 'GridApi', type: 'class', desc: 'Imperative API obtained from the (gridReady) event; provides exportDataAsCsv, getSelectedRows, setGridOption, refreshCells, and applyColumnState.' },
    { name: 'GridReadyEvent', type: 'interface', desc: 'Event emitted by ag-grid-angular when the grid is initialised; its .api property gives access to the GridApi instance.' },
    { name: 'themeQuartz', type: 'class', desc: 'Built-in CSS-in-JS theme from ag-grid-community (AG Grid 31+); passed via [theme] input to replace legacy CSS class-based themes.' },
    { name: 'valueFormatter', type: 'function', desc: 'ColDef callback that transforms a raw cell value into a display string without mutating underlying data (e.g., currency or date formatting).' },
    { name: 'cellRenderer', type: 'function', desc: 'ColDef callback (or component) that returns a full HTML string for a cell, enabling badges, icons, and interactive elements.' },
    { name: 'setGridOption', type: 'function', desc: 'GridApi method to update any grid option at runtime, e.g., setGridOption(\'quickFilterText\', val) to apply a global search filter.' },
    { name: 'exportDataAsCsv', type: 'function', desc: 'GridApi method that serialises the current filtered/sorted grid view to CSV and triggers a browser download with no server required.' },
    { name: 'defaultColDef', type: 'interface', desc: 'A single ColDef object whose properties are applied as defaults to every column, reducing repetition across the columnDefs array.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Row data: plain property vs Angular Signal', before: '// Old: plain class property — no automatic reactivity\nexport class MyGrid {\n  rowData: Employee[] = EMPLOYEES;\n\n  addRow(e: Employee) {\n    this.rowData = [...this.rowData, e]; // must reassign manually\n  }\n}', after: '// New (Angular 16+): Signal — reactive, no zone triggers needed\nexport class MyGrid {\n  rowData = signal<Employee[]>(EMPLOYEES);\n\n  addRow(e: Employee) {\n    this.rowData.update(rows => [...rows, e]);\n  }\n}',
      note: 'Using signal() makes row data reactive; read it in the template with rowData().' },
    { title: 'Getting GridApi: @ViewChild vs (gridReady) event', before: '// Old pattern: @ViewChild on the grid component\n@ViewChild(\'myGrid\') grid!: AgGridAngular;\n\nngAfterViewInit() {\n  const api = this.grid.api; // often undefined on first render\n}', after: '// Recommended: use the (gridReady) event output\nprivate gridApi!: GridApi;\n\nonGridReady(event: GridReadyEvent) {\n  this.gridApi = event.api; // always defined when fired\n}',
      note: '(gridReady) fires once the grid is fully initialised, guaranteeing the API is available.' },
    { title: 'Applying a quick filter: direct DOM vs setGridOption', before: '// Old: reached into the grid\'s internal state\nthis.grid.api.setQuickFilter(filterText); // deprecated API', after: '// Current: use the unified setGridOption helper\nthis.gridApi.setGridOption(\'quickFilterText\', filterText);\n// Works for any grid option, not just filters',
      note: 'setQuickFilter was removed in AG Grid 31; setGridOption is the current unified API.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mutating rowData in place instead of replacing the reference', wrong: '// BUG: mutating the array — grid does NOT re-render\nthis.employees.push(newRow);\nthis.rowData.set(this.employees); // same reference!', right: '// Correct: always pass a new array reference\nthis.rowData.update(rows => [...rows, newRow]);', explanation: 'AG Grid (and Angular Signals) detect changes by reference equality. Pushing into an existing array and setting the same reference skips change detection entirely.'  },
    { title: 'Reading signal value in template without calling it', wrong: '<!-- BUG: passes the Signal function object, not its value -->\n<ag-grid-angular [rowData]="rowData" />', right: '<!-- Correct: invoke the signal with () to unwrap the value -->\n<ag-grid-angular [rowData]="rowData()" />', explanation: 'An Angular Signal is a getter function. Without the () the grid receives the function object instead of the Employee array, resulting in no rows displayed.'  },
    { title: 'Trying to use gridApi before (gridReady) fires', wrong: '// BUG: gridApi is still undefined here\nngOnInit() {\n  this.gridApi.exportDataAsCsv(); // TypeError\n}', right: '// Correct: only call gridApi after (gridReady)\nonGridReady(e: GridReadyEvent) { this.gridApi = e.api; }\nexportCsv() { this.gridApi?.exportDataAsCsv(); }', explanation: 'The grid initialises asynchronously. Accessing gridApi before the (gridReady) event fires always throws because the property is still undefined.'  },
    { title: 'Using valueFormatter when cellRenderer is needed (or vice versa)', wrong: '// valueFormatter can only return a plain string,\n// not HTML — tags will appear as escaped text\n{ field: \'status\', valueFormatter: p => \'<b>\' + p.value + \'</b>\' }', right: '// Use cellRenderer to inject real HTML into the cell\n{ field: \'status\', cellRenderer: (p: {value: string}) =>\n  \'<b>\' + p.value + \'</b>\' }', explanation: 'valueFormatter is for display strings (used by the cell, tooltip, and CSV export). cellRenderer controls the full cell HTML. Mixing them up renders escaped tags as plain text.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '31', label: 'AG Grid 31 — CSS-in-JS Theming', features: ['themeQuartz and other built-in themes replace legacy CSS file imports', 'setQuickFilter() removed; use setGridOption(\'quickFilterText\', val) instead', 'Theme object passed via [theme] input on <ag-grid-angular>'] },
    { version: '16', label: 'Angular 16 — Signals', features: ['signal<T>() replaces plain properties for reactive state', 'rowData = signal<Employee[]>([]) integrates cleanly with AG Grid\'s reference-change detection', 'Computed and effect() hooks available for derived grid state'] },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// npm install ag-grid-angular ag-grid-community
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, themeQuartz } from 'ag-grid-community';

@Component({
  imports: [AgGridAngular],
  template: \`
    <ag-grid-angular
      [theme]="theme"
      [rowData]="rowData"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      style="height: 400px"
    />
  \`,
})
export class MyGrid {
  theme      = themeQuartz;  // built-in theme
  rowData    = signal<Employee[]>([...]);
  columnDefs: ColDef<Employee>[] = [
    { field: 'name',   flex: 1, sortable: true, filter: true },
    { field: 'salary', sortable: true, valueFormatter: p => '$' + p.value },
  ];
  defaultColDef: ColDef = { resizable: true };
}`,
    },
    {
      label: 'Column features',
      language: 'typescript',
      code: `columnDefs: ColDef[] = [
  // Sortable + filterable
  { field: 'name', sortable: true, filter: true },

  // Custom value formatter (display only)
  { field: 'salary', valueFormatter: p => \`$\${p.value.toLocaleString()}\` },

  // Custom cell renderer (HTML string or component)
  {
    field: 'status',
    cellRenderer: (p: { value: string }) =>
      p.value === 'Active'
        ? '<span class="badge green">Active</span>'
        : '<span class="badge red">Inactive</span>',
  },

  // Pinned column
  { field: 'id', pinned: 'left', width: 60 },

  // Flex sizing
  { field: 'description', flex: 2 },  // takes 2x space
];`,
    },
    {
      label: 'GridApi',
      language: 'typescript',
      code: `import { GridReadyEvent, GridApi } from 'ag-grid-community';

export class MyGrid {
  private gridApi!: GridApi;

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  // Export to CSV
  exportCsv() { this.gridApi.exportDataAsCsv(); }

  // Quick filter (searches all columns)
  filter(text: string) {
    this.gridApi.setGridOption('quickFilterText', text);
  }

  // Get selected rows
  getSelected() { return this.gridApi.getSelectedRows(); }

  // Refresh data
  refresh() { this.gridApi.refreshCells(); }

  // Programmatic sort
  sortByName() {
    this.gridApi.applyColumnState({
      state: [{ colId: 'name', sort: 'asc' }],
    });
  }
}`,
    },
  ];
}
