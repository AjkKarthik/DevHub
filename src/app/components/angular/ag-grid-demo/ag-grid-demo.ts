import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi, themeQuartz } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

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
  imports: [
    AgGridAngular, FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './ag-grid-demo.html',
  styleUrl: './ag-grid-demo.scss',
})
export class AgGridDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Angular Signals', route: '/angular/signals' },
  ];

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

  theory: TheoryPoint[] = [
    {
      heading: 'AG Grid core concepts and Angular integration',
      points: [
        'AG Grid is a framework-agnostic data grid library. <code>ag-grid-angular</code> is a thin Angular wrapper that translates <code>@Input()</code> bindings and <code>@Output()</code> events to AG Grid\'s core API. The community edition is free; Enterprise adds grouping, pivot, and server-side row model.',
        '<code>rowData</code> is the array of row objects — each object\'s keys map to column <code>field</code> values. <code>columnDefs</code> is an array of <code>ColDef</code> objects that describe what each column displays and how it behaves.',
        '<code>defaultColDef</code> is a single <code>ColDef</code> object whose properties are applied as defaults to every column. Use it to set <code>sortable: true</code>, <code>resizable: true</code>, and <code>filter: true</code> once, without repeating on every column.',
        '<code>GridApi</code> is obtained from the <code>(gridReady)="onGridReady($event)"</code> event — store <code>event.api</code>. Use it for imperative operations: <code>exportDataAsCsv()</code>, <code>getSelectedRows()</code>, <code>setGridOption()</code>, <code>refreshCells()</code>.',
        'AG Grid uses a virtual DOM independent of Angular\'s — it manages its own rendering pipeline. This means <code>OnPush</code> change detection does not affect AG Grid\'s internal rendering, but Angular signals used as <code>[rowData]="rowData()"</code> still trigger Angular\'s binding pipeline.',
      ],
    },
    {
      heading: 'Column definitions (ColDef) — the full feature set',
      points: [
        '<code>field: \'name\'</code> maps to the key in each row object. <code>headerName</code> sets the visible header text. Without <code>field</code>, use <code>valueGetter: (p) => p.data?.salary</code> to compute a value from the row.',
        '<code>valueFormatter</code>: a callback that transforms the raw cell value into a <strong>display string</strong> without mutating the data. Used for currency, dates, and enum labels. The underlying data is unchanged, so sorting and CSV export still use the raw value.',
        '<code>cellRenderer</code>: a callback (or Angular component class) that returns full HTML for the cell — for badges, buttons, icons, or progress bars. Receives a <code>ICellRendererParams</code> object with <code>value</code>, <code>data</code> (the full row), and the grid API.',
        '<code>flex: 1</code> works like CSS flexbox — columns with flex share the remaining width after fixed-width (<code>width: 120</code>) columns are allocated. <code>minWidth</code> / <code>maxWidth</code> constrain the flex range.',
        '<code>pinned: \'left\'</code> or <code>pinned: \'right\'</code> locks a column to the edge of the grid — it stays visible while other columns scroll horizontally. Common for ID/name columns and action buttons.',
      ],
    },
    {
      heading: 'Row selection, filtering, and CSV export',
      points: [
        '<code>rowSelection="multiple"</code> enables multi-row selection with checkboxes. <code>rowSelection="single"</code> allows only one row at a time. Listen to <code>(selectionChanged)</code> and call <code>gridApi.getSelectedRows()</code> to get the selected objects.',
        '<code>gridApi.setGridOption(\'quickFilterText\', value)</code> applies a global text filter across every column simultaneously — any row where at least one cell matches the text is shown. This replaced the deprecated <code>setQuickFilter()</code> in AG Grid 31.',
        'Column-level filters: <code>filter: true</code> shows a filter icon in the header. Click it to open a per-column filter UI. Specify <code>filter: \'agNumberColumnFilter\'</code> or <code>\'agDateColumnFilter\'</code> for typed filters.',
        '<code>gridApi.exportDataAsCsv({ fileName: \'data.csv\', columnKeys: [\'name\', \'salary\'] })</code> serialises the current filtered/sorted grid view to CSV and triggers a browser download. Enterprise adds Excel export via <code>exportDataAsExcel()</code>.',
        '<code>gridApi.applyColumnState({ state: [{ colId: \'name\', sort: \'asc\' }] })</code> programmatically sorts or pins columns. Useful for implementing custom "sort by salary" buttons outside the grid header.',
      ],
    },
    {
      heading: 'AG Grid with Angular Signals',
      points: [
        'Declare row data as a signal: <code>rowData = signal&lt;Employee[]&gt;(EMPLOYEES)</code>. Pass it to the grid with <code>[rowData]="rowData()"</code> — the <code>()</code> is critical. Without it the grid receives the Signal function object instead of the Employee array.',
        'AG Grid detects changes by <strong>reference equality</strong>. When you update the signal, always produce a new array: <code>this.rowData.update(rows => [...rows, newRow])</code>. Pushing into the existing array and calling <code>set()</code> with the same reference is silently ignored.',
        'For derived state (e.g. the count of active employees), use <code>computed()</code>: <code>activeCount = computed(() => this.rowData().filter(e => e.active).length)</code>. Display with <code>{{ activeCount() }}</code> in the template.',
        'The <code>quickFilter</code> and <code>selectedCount</code> signals in the demo are "UI state" — they mirror what\'s happening in the grid but are independent of <code>rowData</code>. Keep grid state (what\'s selected) in signals so the template stays reactive without subscribing to grid events manually.',
        'Using <code>effect()</code> to call <code>gridApi.setGridOption()</code> when a signal changes is an alternative to calling it directly in a method — but only set up the effect after <code>gridApi</code> is available (<code>afterNextRender</code> or inside <code>onGridReady</code>).',
      ],
    },
    {
      heading: 'Performance — large datasets and virtual scrolling',
      points: [
        'AG Grid uses row virtualisation by default: only the rows currently visible in the viewport are in the DOM. Scrolling through 100,000 rows is fast because AG Grid recycles DOM nodes as rows scroll in and out.',
        'For very large datasets (millions of rows), use <strong>Server-Side Row Model</strong> (<code>rowModelType: \'serverSide\'</code>). AG Grid fetches only the current page from your API instead of loading all data at once. Enterprise only.',
        'Column virtualisation is enabled by default for wide grids — only columns in the visible viewport are rendered. Disable with <code>suppressColumnVirtualisation: true</code> if you need all columns available for clipboard operations.',
        '<code>getRowId: (params) => String(params.data.id)</code> — providing stable row IDs enables AG Grid to update individual rows efficiently (<code>gridApi.applyTransaction()</code>) instead of re-rendering the entire dataset on every change.',
        '<code>gridApi.applyTransaction({ add: [], update: [], remove: [] })</code> is the efficient way to apply incremental changes without replacing the entire <code>rowData</code>. Each operation is processed in a single batch with a single re-render pass.',
      ],
    },
    {
      heading: 'Theming and accessibility',
      points: [
        'AG Grid 31+ uses a CSS-in-JS theming system. Import a theme object (<code>themeQuartz</code>, <code>themeAlpine</code>, <code>themeMaterial</code>) and pass it via the <code>[theme]</code> input. No CSS file import needed.',
        'Customise a built-in theme: <code>const myTheme = themeQuartz.withParams({ spacing: 8, accentColor: \'#dd0031\' })</code>. Parameters map directly to CSS custom properties under the hood.',
        'AG Grid implements WCAG 2.1 AA — column headers have correct ARIA roles, rows have <code>role="row"</code>, and keyboard navigation (Tab, arrow keys, Enter to select) works out of the box.',
        'Dark mode: use <code>themeQuartz.withParams({ backgroundColor: \'#1f2937\', foregroundColor: \'#f9fafb\' })</code> or switch themes based on a signal: <code>[theme]="isDark() ? darkTheme : lightTheme"</code>.',
        'For RTL layouts set <code>enableRtl: true</code> on the grid options. Column headers and cell alignment flip automatically without custom CSS.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
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
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      (gridReady)="onGridReady($event)"
      style="height: 400px"
    />
  \`,
})
export class MyGrid {
  theme      = themeQuartz;            // built-in CSS-in-JS theme (AG Grid 31+)
  rowData    = signal<Employee[]>([]);
  columnDefs: ColDef<Employee>[] = [
    { field: 'name',   flex: 1,    sortable: true, filter: true },
    { field: 'salary', width: 120, sortable: true,
      valueFormatter: p => \`$\${p.value.toLocaleString()}\` },
  ];
  defaultColDef: ColDef = { resizable: true };

  onGridReady(e: GridReadyEvent) { this.gridApi = e.api; }
}`,
    },
    {
      label: 'Column features',
      language: 'typescript',
      code: `columnDefs: ColDef[] = [
  // Sortable + filterable
  { field: 'name', sortable: true, filter: true },

  // valueFormatter — display only, raw value used for sorting/CSV
  { field: 'salary', valueFormatter: p => \`$\${p.value.toLocaleString()}\` },

  // cellRenderer — full HTML in the cell
  {
    field: 'status',
    cellRenderer: (p: { value: string }) =>
      p.value === 'Active'
        ? '<span class="badge green">Active</span>'
        : '<span class="badge red">Inactive</span>',
  },

  // valueGetter — compute from row without a dedicated field
  {
    headerName: 'Band',
    valueGetter: (p) => {
      const s = p.data?.salary;
      return s >= 115000 ? 'Senior' : s >= 90000 ? 'Mid' : 'Junior';
    },
  },

  // Pinned column — stays visible during horizontal scroll
  { field: 'id', pinned: 'left', width: 60 },

  // Flex sizing — fills remaining width proportionally
  { field: 'description', flex: 2 },  // takes 2x the flex space
];`,
    },
    {
      label: 'GridApi methods',
      language: 'typescript',
      code: `import { GridReadyEvent, GridApi } from 'ag-grid-community';

export class MyGrid {
  private gridApi!: GridApi;

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  // Export to CSV — uses current filtered/sorted view
  exportCsv() {
    this.gridApi.exportDataAsCsv({ fileName: 'employees.csv' });
  }

  // Quick filter — searches ALL columns at once
  filter(text: string) {
    this.gridApi.setGridOption('quickFilterText', text);
  }

  // Get selected rows
  getSelected(): Employee[] { return this.gridApi.getSelectedRows(); }

  // Programmatic sort
  sortByName() {
    this.gridApi.applyColumnState({
      state: [{ colId: 'name', sort: 'asc' }],
    });
  }

  // Incremental update (much faster than replacing rowData for large grids)
  addRow(emp: Employee) {
    this.gridApi.applyTransaction({ add: [emp] });
  }
  updateRow(emp: Employee) {
    this.gridApi.applyTransaction({ update: [emp] }); // needs getRowId
  }
  removeRow(emp: Employee) {
    this.gridApi.applyTransaction({ remove: [emp] });
  }
}`,
    },
    {
      label: 'Pagination',
      language: 'typescript',
      code: `// Client-side pagination — works with existing rowData
@Component({
  template: \`
    <ag-grid-angular
      [theme]="theme"
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      [pagination]="true"
      [paginationPageSize]="10"
      [paginationPageSizeSelector]="[10, 25, 50, 100]"
      style="height: 500px"
    />
  \`,
})
export class PagedGrid {
  theme   = themeQuartz;
  rowData = signal<Employee[]>(EMPLOYEES); // AG Grid handles paging automatically
  columnDefs: ColDef[] = [...];
}

// Getting pagination state programmatically:
// gridApi.paginationGetCurrentPage()      → current page index (0-based)
// gridApi.paginationGetPageSize()         → rows per page
// gridApi.paginationGoToPage(3)           → jump to page 4
// gridApi.paginationGetTotalPages()       → total page count

// For server-side pagination: use rowModelType: 'serverSide' (Enterprise)
// and implement a datasource that fetches on demand.`,
    },
    {
      label: 'Angular cell component',
      language: 'typescript',
      code: `// A fully standalone Angular component as a cell renderer
import { ICellRendererAngularComp, AgGridAngular } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: true,
  template: \`
    <div style="display:flex; align-items:center; gap:8px;">
      <span [style.color]="color">{{ label }}</span>
      <button (click)="onClick()">Edit</button>
    </div>
  \`,
})
export class StatusCellRenderer implements ICellRendererAngularComp {
  label = '';
  color = '';
  private params!: ICellRendererParams;

  // Called by AG Grid when cell renders or data changes
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.label = params.value ? 'Active' : 'Inactive';
    this.color = params.value ? '#166534' : '#991b1b';
  }

  // Called by AG Grid when cell value changes without full re-render
  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true; // true = handled; false = AG Grid re-renders the cell itself
  }

  onClick() {
    // Access the full row via this.params.data
    console.log('Edit row:', this.params.data);
  }
}

// Register in columnDefs:
{ field: 'active', cellRenderer: StatusCellRenderer }`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'In the AgGridDemo component, how is the GridApi instance obtained and stored?',
      options: [
        'By injecting GridApi via Angular\'s dependency injection system',
        'By listening to the (gridReady) event and storing event.api',
        'By calling AgGridAngular.getApi() after view initialization',
        'By declaring a viewChild(AgGridAngular) reference',
      ],
      answer: 1,
      explanation: 'The component listens to (gridReady)="onGridReady($event)" on the ag-grid-angular element. Inside onGridReady it stores the API: this.gridApi = event.api. This is the standard AG Grid pattern for accessing imperative grid operations.',
    },
    {
      q: 'What is the difference between valueFormatter and cellRenderer in an AG Grid ColDef?',
      options: [
        'valueFormatter changes the underlying data model; cellRenderer only changes display',
        'valueFormatter transforms the display value as a string; cellRenderer returns full HTML for the cell',
        'valueFormatter applies to the entire row; cellRenderer applies only to a single cell',
        'They are interchangeable — both return an HTML string for the cell',
      ],
      answer: 1,
      explanation: 'valueFormatter transforms the raw value into a display string without affecting the data (used for currency: p => `$${p.value.toLocaleString()}`). cellRenderer returns full HTML for the cell, allowing richer output like colored Active/Inactive badges. valueFormatter output is also used by the CSV export and tooltip.',
    },
    {
      q: 'Why does the rowData binding in the template use rowData() instead of just rowData?',
      options: [
        'Because AG Grid requires a function call to trigger change detection',
        'Because rowData is an Angular Signal and must be invoked to read its current value',
        'Because rowData is an async observable that needs to be unwrapped',
        'Because the HTML template cannot access class properties directly',
      ],
      answer: 1,
      explanation: 'rowData is declared as rowData = signal<Employee[]>(EMPLOYEES). Angular Signals are getter functions — calling them with () reads the current value. Without () the grid receives the Signal function object instead of the Employee array, resulting in no rows displayed.',
    },
    {
      q: 'What does calling this.gridApi.setGridOption(\'quickFilterText\', val) accomplish?',
      options: [
        'It filters only the currently visible column based on val',
        'It applies a global text filter that searches across all column values simultaneously',
        'It permanently removes rows that do not match val from rowData',
        'It sorts all columns alphabetically by val',
      ],
      answer: 1,
      explanation: 'The quickFilterText grid option applies a global search across every column in the grid. Any row where at least one cell value matches the text is shown. setGridOption is the unified API (AG Grid 31+) that replaced the deprecated setQuickFilter() method.',
    },
    {
      q: 'Which ColDef property controls how a column shares available grid width proportionally?',
      options: [
        'width: 130',
        'flex: 1',
        'resizable: true',
        'minWidth: 100',
      ],
      answer: 1,
      explanation: 'The flex property works like CSS flexbox. Columns with flex: 1 share the remaining width after fixed-width columns are allocated. In the demo, name and role both use flex: 1 so they take equal shares of the remaining space.',
    },
    {
      q: 'What is the correct way to update rowData in AG Grid when using Angular Signals to ensure the grid re-renders?',
      options: [
        'Push a new item into the existing array and call gridApi.refreshCells()',
        'Call this.rowData.set(this.rowData()) with no changes — this always forces a re-render',
        'Always produce a new array reference: this.rowData.update(rows => [...rows, newRow])',
        'Call gridApi.applyTransaction() and then set the signal to the same array',
      ],
      answer: 2,
      explanation: 'AG Grid (and Angular change detection) detect changes by reference equality. Mutating the existing array and calling set() with the same reference is silently ignored. Spread into a new array (or use gridApi.applyTransaction() for incremental updates) to trigger a re-render.',
    },
    {
      q: 'When implementing an Angular component as a cell renderer, which interface must it implement?',
      options: [
        'CellRendererAngular from @angular/core',
        'ICellRendererAngularComp from ag-grid-angular',
        'ICellRenderer from ag-grid-community',
        'AgCellComponent from @angular/material',
      ],
      answer: 1,
      explanation: 'Angular component cell renderers must implement ICellRendererAngularComp from ag-grid-angular. This interface requires implementing agInit(params) (called on first render) and refresh(params): boolean (called when the cell value changes). Register the component class in columnDefs: { cellRenderer: MyCellComponent }.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'How do you get the AG Grid API instance in Angular?', a: 'Listen to <code>(gridReady)="onGridReady($event)"</code> on the <code>&lt;ag-grid-angular&gt;</code> element. The event carries <code>event.api</code> — store it as <code>this.gridApi = event.api</code>. Use it to call methods like <code>gridApi.exportDataAsCsv()</code>, <code>getSelectedRows()</code>, and <code>setGridOption()</code>.' },
    { q: 'How do you trigger a grid refresh after data changes?', a: 'Always pass a <strong>new array reference</strong> to the <code>rowData</code> signal: <code>this.rowData.update(rows => [...rows, newRow])</code>. AG Grid detects reference changes and re-renders. For incremental row updates (add/update/remove individual rows), use <code>gridApi.applyTransaction()</code> instead — it is significantly faster for large datasets.' },
    { q: 'What is a cell renderer in AG Grid?', a: 'A cell renderer is a function or Angular component class that returns custom content for a cell. As a function: <code>cellRenderer: (p: ICellRendererParams) => \'&lt;strong&gt;\' + p.value + \'&lt;/strong&gt;\'</code>. As a component: implement <code>ICellRendererAngularComp</code> with <code>agInit()</code> and <code>refresh()</code> methods.' },
    { q: 'How do you enable sorting and filtering in AG Grid?', a: 'Set <code>sortable: true</code> and <code>filter: true</code> on each <code>ColDef</code>, or set them in <code>defaultColDef</code> to apply globally. Click column headers to sort. Click the filter icon for column-level filters. Use <code>gridApi.setGridOption(\'quickFilterText\', text)</code> for a global search across all columns.' },
    { q: 'How do you export grid data to CSV?', a: '<code>gridApi.exportDataAsCsv({ fileName: \'data.csv\', columnKeys: [\'name\', \'salary\'] })</code>. AG Grid builds the CSV from the current filtered/sorted view and triggers a browser download — no server or library needed. Enterprise adds <code>exportDataAsExcel()</code>.' },
    { q: 'What is themeQuartz and how is it applied?', a: '<code>import { themeQuartz } from \'ag-grid-community\'</code>. Pass <code>[theme]="themeQuartz"</code> to <code>&lt;ag-grid-angular&gt;</code>. This is the CSS-in-JS theming system in AG Grid 31+ — no separate CSS file needed. Customise with <code>themeQuartz.withParams({ accentColor: \'#dd0031\' })</code>.' },
    { q: 'How do you add pagination to AG Grid?', a: 'Add <code>[pagination]="true"</code> and <code>[paginationPageSize]="10"</code> inputs to <code>&lt;ag-grid-angular&gt;</code>. AG Grid handles client-side paging automatically from the existing <code>rowData</code> — no server call needed. For server-side pagination use <code>rowModelType: \'serverSide\'</code> (Enterprise) and implement a datasource.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AgGridAngular', type: 'directive', desc: 'Angular wrapper component for AG Grid — import from ag-grid-angular and use <ag-grid-angular> in templates.', since: '22' },
    { name: 'ColDef', type: 'interface', desc: 'TypeScript interface for a single column: field, headerName, sortable, filter, flex, width, valueFormatter, cellRenderer, pinned, etc.' },
    { name: 'GridApi', type: 'class', desc: 'Imperative API from the (gridReady) event — exportDataAsCsv, getSelectedRows, setGridOption, applyTransaction, applyColumnState.' },
    { name: 'themeQuartz', type: 'class', desc: 'Built-in CSS-in-JS theme (AG Grid 31+) passed via [theme] input. Customise with .withParams({ accentColor, spacing, ... }).' },
    { name: 'valueFormatter', type: 'function', desc: 'ColDef callback that converts raw cell value to a display string. Used for currency, dates; does not affect sorting, filtering, or CSV export values.' },
    { name: 'cellRenderer', type: 'function', desc: 'ColDef callback or Angular component class that returns full HTML for a cell. Use for badges, buttons, progress bars, icons.' },
    { name: 'defaultColDef', type: 'interface', desc: 'Shared ColDef applied to all columns — set sortable, resizable, filter once here rather than on every column definition.' },
    { name: 'applyTransaction', type: 'method', desc: 'GridApi method for efficient incremental row updates: { add, update, remove } processed in one render pass. Requires getRowId for update/remove.' },
    { name: 'setGridOption', type: 'method', desc: 'Unified runtime option setter — setGridOption(\'quickFilterText\', val) for global search, setGridOption(\'pagination\', true) to toggle paging.' },
    { name: 'ICellRendererAngularComp', type: 'interface', desc: 'Interface for Angular component cell renderers — implement agInit(params) and refresh(params): boolean to integrate with AG Grid\'s lifecycle.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Row data: plain property vs Angular Signal',
      before: `// Old: plain class property — no automatic reactivity
export class MyGrid {
  rowData: Employee[] = EMPLOYEES;

  addRow(e: Employee) {
    this.rowData = [...this.rowData, e]; // must reassign manually
  }
}`,
      after: `// New (Angular 16+): Signal — reactive, integrates with template
export class MyGrid {
  rowData = signal<Employee[]>(EMPLOYEES);

  addRow(e: Employee) {
    this.rowData.update(rows => [...rows, e]);
    // template: [rowData]="rowData()"  ← must call ()
  }
}`,
      note: 'Using signal() makes row data reactive — computed() and effect() can derive from it. Always call rowData() (with parentheses) in the template.',
    },
    {
      title: 'Getting GridApi: @ViewChild vs (gridReady) event',
      before: `// Old pattern: @ViewChild on the grid component
@ViewChild('myGrid') grid!: AgGridAngular;

ngAfterViewInit() {
  const api = this.grid.api; // often undefined on first render
}`,
      after: `// Recommended: use the (gridReady) event output
private gridApi!: GridApi;

onGridReady(event: GridReadyEvent) {
  this.gridApi = event.api; // always defined when this fires
}`,
      note: '(gridReady) fires once the grid is fully initialised, guaranteeing the API is available. @ViewChild may return undefined if the grid renders asynchronously.',
    },
    {
      title: 'Quick filter: deprecated setQuickFilter vs setGridOption',
      before: `// Deprecated AG Grid 30 API — removed in AG Grid 31
this.gridApi.setQuickFilter(filterText);`,
      after: `// Current unified API (AG Grid 31+)
this.gridApi.setGridOption('quickFilterText', filterText);
// Works for any grid option, not just filters`,
      note: 'setGridOption is the single API for all runtime grid option changes in AG Grid 31+.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating rowData in place instead of replacing the reference',
      wrong: `// BUG: mutating the array — grid does NOT re-render
this.employees.push(newRow);
this.rowData.set(this.employees); // same reference — silently ignored!`,
      right: `// Correct: always pass a new array reference
this.rowData.update(rows => [...rows, newRow]);
// Or for efficiency on large grids:
this.gridApi.applyTransaction({ add: [newRow] });`,
      explanation: 'AG Grid and Angular Signals both detect changes by reference equality. Pushing into an existing array and setting the same reference skips change detection entirely. Always spread into a new array, or use applyTransaction for incremental updates.',
    },
    {
      title: 'Reading signal value in template without calling it',
      wrong: `<!-- BUG: passes the Signal function object, not its value -->
<ag-grid-angular [rowData]="rowData" />`,
      right: `<!-- Correct: invoke the signal with () to unwrap the value -->
<ag-grid-angular [rowData]="rowData()" />`,
      explanation: 'An Angular Signal is a getter function. Without () the grid receives the function object instead of the Employee array, resulting in no rows displayed and no console error — a silent failure.',
    },
    {
      title: 'Trying to use gridApi before (gridReady) fires',
      wrong: `// BUG: gridApi is still undefined here
ngOnInit() {
  this.gridApi.exportDataAsCsv(); // TypeError: Cannot read properties of undefined
}`,
      right: `// Correct: only call gridApi after (gridReady)
onGridReady(e: GridReadyEvent) { this.gridApi = e.api; }
exportCsv() { this.gridApi?.exportDataAsCsv(); }`,
      explanation: 'The grid initialises asynchronously. Accessing gridApi before (gridReady) fires always throws because the property is still undefined. Always use optional chaining (?.) as a guard.',
    },
    {
      title: 'Using valueFormatter when cellRenderer is needed (or vice versa)',
      wrong: `// valueFormatter can only return a plain string —
// HTML tags appear as escaped text in the cell
{ field: 'status', valueFormatter: p => '<b>' + p.value + '</b>' }`,
      right: `// Use cellRenderer to inject real HTML
{ field: 'status', cellRenderer: (p: {value: string}) =>
  '<b>' + p.value + '</b>' }`,
      explanation: 'valueFormatter is for display strings (also used by tooltip and CSV export). cellRenderer controls the full cell HTML. Mixing them up renders escaped tags as plain text in the cell.',
    },
    {
      title: 'Not giving ag-grid-angular a fixed height — the grid renders invisible',
      wrong: `<!-- BUG: no height — AG Grid renders at 0px height -->
<ag-grid-angular [rowData]="rowData()" [columnDefs]="cols" />`,
      right: `<!-- Correct: set an explicit height on the grid or its container -->
<ag-grid-angular
  [rowData]="rowData()"
  [columnDefs]="cols"
  style="height: 400px; width: 100%"
/>`,
      explanation: 'AG Grid uses absolute positioning internally and requires an explicit height on the grid element or its container. Without a height the grid renders at 0px — the DOM is present but invisible, with no error logged.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a Custom \'Salary Band\' Column with Cell Renderer',
    description: 'Extend the AG Grid employee table by adding a new computed column called \'Band\' that displays a colored badge based on the employee\'s salary range. Salary < 90000 = \'Junior\' (blue badge), 90000–114999 = \'Mid\' (yellow badge), >= 115000 = \'Senior\' (green badge). Add the column definition to the existing columnDefs array and implement the cellRenderer function.',
    language: 'typescript',
    hints: [
      'Use a valueGetter: (p) => p.data?.salary to access the salary from the row without needing a dedicated field on Employee.',
      'Use cellRenderer: (p: { value: number }) => ... to return an HTML string with inline styles for each badge color.',
      'Add the new ColDef object to the end of the columnDefs array. You do not need to modify the Employee interface or EMPLOYEES data.',
      'The badge HTML structure is the same as the Active/Inactive badges already in the Status column — just change the colors and labels.',
    ],
    starterCode: `// Add a new ColDef entry to the columnDefs array in ag-grid-demo.ts
// Salary < 90000      => 'Junior'  (color:#1e40af, background:#dbeafe)
// Salary 90000-114999 => 'Mid'     (color:#92400e, background:#fef3c7)
// Salary >= 115000    => 'Senior'  (color:#166534, background:#dcfce7)

columnDefs: ColDef<Employee>[] = [
  { field: 'id',         headerName: '#',      width: 70,  sortable: true },
  { field: 'name',       headerName: 'Name',   flex: 1,    sortable: true, filter: true },
  { field: 'role',       headerName: 'Role',   flex: 1,    sortable: true, filter: true },
  { field: 'department', headerName: 'Dept',   width: 130, sortable: true, filter: true },
  {
    field: 'salary', headerName: 'Salary', width: 120, sortable: true,
    valueFormatter: p => p.value ? \`$\${p.value.toLocaleString()}\` : '',
  },
  {
    field: 'active', headerName: 'Status', width: 100,
    cellRenderer: (p: { value: boolean }) =>
      p.value
        ? \`<span style="color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.8rem;">Active</span>\`
        : \`<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:4px;font-size:.8rem;">Inactive</span>\`,
  },
  // TODO: Add your 'Band' column definition here
];`,
    solution: `columnDefs: ColDef<Employee>[] = [
  { field: 'id',         headerName: '#',      width: 70,  sortable: true },
  { field: 'name',       headerName: 'Name',   flex: 1,    sortable: true, filter: true },
  { field: 'role',       headerName: 'Role',   flex: 1,    sortable: true, filter: true },
  { field: 'department', headerName: 'Dept',   width: 130, sortable: true, filter: true },
  {
    field: 'salary', headerName: 'Salary', width: 120, sortable: true,
    valueFormatter: p => p.value ? \`$\${p.value.toLocaleString()}\` : '',
  },
  {
    field: 'active', headerName: 'Status', width: 100,
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
      const badge = (label: string, color: string, bg: string) =>
        \`<span style="color:\${color};background:\${bg};padding:2px 8px;border-radius:4px;font-size:.8rem;">\${label}</span>\`;
      if (p.value >= 115000) return badge('Senior', '#166534', '#dcfce7');
      if (p.value >= 90000)  return badge('Mid',    '#92400e', '#fef3c7');
      return badge('Junior', '#1e40af', '#dbeafe');
    },
  },
];`,
  };

  revision: RevisionSummary = {
    oneLiner: 'AG Grid is the industry-standard Angular data grid — wire rowData as a signal, define columns in columnDefs, get the GridApi from the (gridReady) event, and use valueFormatter for display strings vs cellRenderer for full cell HTML.',
    mustKnow: [
      'Declare row data as <code>rowData = signal&lt;T[]&gt;([])</code> and bind with <code>[rowData]="rowData()"</code> — the <code>()</code> is required to unwrap the signal',
      'AG Grid detects changes by reference equality — always spread into a new array: <code>rowData.update(rows => [...rows, newRow])</code>',
      '<code>GridApi</code> is obtained from <code>(gridReady)="onGridReady($event)"</code> — never access it before this event fires',
      '<code>valueFormatter</code> = display string only (also used by CSV/tooltip); <code>cellRenderer</code> = full HTML in the cell; never use formatter for HTML',
      '<code>setGridOption(\'quickFilterText\', val)</code> searches all columns; replaces deprecated <code>setQuickFilter()</code> in AG Grid 31+',
      '<code>gridApi.applyTransaction({ add, update, remove })</code> updates individual rows efficiently — faster than replacing all <code>rowData</code>',
      'Always give <code>&lt;ag-grid-angular&gt;</code> a fixed height (<code>style="height:400px"</code>) — without it the grid renders invisible at 0px',
    ],
    interviewFocus: [
      'Why must you use () when binding a signal to rowData, and what happens if you omit it?',
      'What is the difference between valueFormatter and cellRenderer in ColDef?',
      'How does AG Grid change detection work, and why must you avoid mutating the rowData array in-place?',
      'When would you use applyTransaction() instead of replacing rowData?',
      'How do you implement an Angular component as a cell renderer, and what interface must it implement?',
    ],
  };
}
