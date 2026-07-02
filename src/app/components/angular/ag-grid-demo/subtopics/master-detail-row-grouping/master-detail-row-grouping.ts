import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-master-detail-row-grouping-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './master-detail-row-grouping.html',
  styleUrl: './master-detail-row-grouping.scss',
})
export class MasterDetailRowGroupingSubtopic {

  agGridDeps = { 'ag-grid-community': 'latest', 'ag-grid-angular': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Row grouping — organizing flat data by a column value',
      points: [
        '<code>{ field: \'department\', rowGroup: true, hide: true }</code> groups rows by that column\'s value INSTEAD OF showing it as a normal column — the grid automatically creates collapsible group header rows (e.g. "Engineering (12)") with a row count, and <code>hide: true</code> removes the now-redundant flat column.',
        '<code>groupDefaultExpanded: 1</code> on the grid options controls how many levels of groups start expanded (<code>-1</code> for "expand everything," <code>0</code> for "start fully collapsed"). Multiple <code>rowGroup: true</code> columns create NESTED groups, applied in the order those columns appear.',
        '<code>aggFunc: \'sum\'</code> (or <code>\'avg\'</code>, <code>\'min\'</code>, <code>\'max\'</code>, <code>\'count\'</code>) on a numeric column shows an AGGREGATED value in each group header row — e.g. total salary per department — computed automatically from the rows within that group, no manual calculation needed.',
      ],
    },
    {
      heading: 'Master/detail — an expandable nested grid per row',
      points: [
        '<code>masterDetail: true</code> on the grid, plus <code>detailCellRendererParams: { detailGridOptions: {...}, getDetailRowData: (params) =&gt; params.successCallback(params.data.orders) }</code> adds an expand arrow to each row that reveals a FULL NESTED AG Grid showing related child data (e.g. a customer\'s order history) — a genuinely different pattern from grouping, which reorganizes the SAME rows rather than nesting a related dataset.',
        'The detail grid is a COMPLETELY SEPARATE grid instance with its own <code>columnDefs</code> — it can have its own sorting, filtering, and even its OWN master/detail nesting (multi-level drill-down), independent of the parent grid\'s configuration.',
      ],
    },
    {
      heading: 'Choosing between grouping and master/detail',
      points: [
        'Use ROW GROUPING when you have one flat dataset and want to view/summarize it organized by a shared attribute (all employees, grouped by department) — the underlying data doesn\'t change, only its PRESENTATION does.',
        'Use MASTER/DETAIL when each row genuinely has its OWN related child dataset that is conceptually different from the parent rows (each customer HAS orders; orders are not "customers grouped by customer") — the detail data is fetched/rendered per-row, not derived from reorganizing the same rows.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Employee {
  name: string;
  department: string;
  salary: number;
  orders?: { id: string; amount: number }[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgGridAngular],
  template: \`
    <h3>Row grouping by department, with a sum aggregation on salary</h3>
    <ag-grid-angular
      style="height: 300px; width: 100%;"
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      [groupDefaultExpanded]="1" />
  \`,
})
export class App {
  rowData = signal<Employee[]>([
    { name: 'Alice', department: 'Engineering', salary: 85000 },
    { name: 'Bilal', department: 'Engineering', salary: 78000 },
    { name: 'Chen', department: 'Design', salary: 72000 },
    { name: 'Dana', department: 'Design', salary: 69000 },
  ]);

  columnDefs: ColDef[] = [
    { field: 'department', rowGroup: true, hide: true },
    { field: 'name' },
    { field: 'salary', aggFunc: 'sum' },
  ];
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Row grouping and aggregation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change groupDefaultExpanded from 1 to 0, and verify both department groups now start fully collapsed instead of expanded.',
    hint: 'Change [groupDefaultExpanded]="1" to [groupDefaultExpanded]="0" in the ag-grid-angular element bindings.',
    solution: `<ag-grid-angular
  style="height: 300px; width: 100%;"
  [rowData]="rowData()"
  [columnDefs]="columnDefs"
  [groupDefaultExpanded]="0" />`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'row grouping and master/detail solve the same problem, just with different visual presentation.',
      reality: 'grouping reorganizes the SAME flat dataset by a shared attribute — master/detail nests a genuinely SEPARATE related dataset per row (a customer\'s orders are not "customers grouped by customer"); they solve different data-shape problems.',
    },
    {
      thought: 'aggFunc requires manually calculating the sum/average yourself before passing data to the grid.',
      reality: 'aggFunc computes the aggregation automatically from the rows within each group — no manual calculation is needed, the grid derives it live from the underlying rowData.',
    },
    {
      thought: 'a master/detail grid\'s nested detail grid must use the same columnDefs and configuration as the parent grid.',
      reality: 'the detail grid is a completely separate grid instance with its own independent columnDefs, sorting, filtering, and even its own potential master/detail nesting — it shares nothing with the parent grid\'s configuration by default.',
    },
  ];
}
