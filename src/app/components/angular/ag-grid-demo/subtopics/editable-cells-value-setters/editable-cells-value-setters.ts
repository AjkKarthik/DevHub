import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-editable-cells-value-setters-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './editable-cells-value-setters.html',
  styleUrl: './editable-cells-value-setters.scss',
})
export class EditableCellsValueSettersSubtopic {

  agGridDeps = { 'ag-grid-community': 'latest', 'ag-grid-angular': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'editable — turning a cell into an input on double-click',
      points: [
        '<code>{ field: \'salary\', editable: true }</code> is the minimum to make a cell editable — double-clicking (or pressing Enter/typing on a selected cell) opens an inline text editor. <code>editable</code> can also be a FUNCTION <code>(params) =&gt; boolean</code> for conditional editability, e.g. only editing rows the current user owns.',
        'By default, editing writes the new value directly onto <code>params.data[field]</code> — MUTATING the row object in place. If your <code>rowData</code> is a signal holding an array you treat as immutable elsewhere in the app, this direct mutation can silently desync your signal-based state from what AG Grid actually shows.',
      ],
    },
    {
      heading: 'cellEditor and valueParser/valueSetter for typed inputs',
      points: [
        '<code>cellEditor: \'agNumberCellEditor\'</code>, <code>\'agSelectCellEditor\'</code>, or <code>\'agLargeTextCellEditor\'</code> swap the default plain-text editor for a TYPED one — e.g. the select editor takes <code>cellEditorParams: { values: [\'Active\', \'Inactive\'] }</code> to render a dropdown instead of free text.',
        '<code>valueSetter(params): boolean</code> is the CORRECT place to control exactly how an edit is applied — return <code>true</code> if you accepted and applied the new value (typically by writing to <code>params.data</code> yourself), or <code>false</code> to REJECT the edit and keep the old value, e.g. when validation fails.',
        'A <code>valueSetter</code> is also where you keep an external signal in sync intentionally: instead of letting AG Grid mutate the row object directly, apply the change through your OWN update method (e.g. calling <code>this.rowData.update(...)</code> with a new array), then return <code>true</code> — this avoids the silent-mutation desync problem.',
      ],
    },
    {
      heading: 'Listening for edits and validating',
      points: [
        '<code>(cellValueChanged)="onCellValueChanged($event)"</code> fires after an edit is committed — <code>event.oldValue</code>, <code>event.newValue</code>, and <code>event.data</code> (the full updated row) are all available, making this the standard hook for persisting an edit to a backend API.',
        'For validation that can REJECT an edit, use <code>valueSetter</code> (return <code>false</code> to reject) rather than <code>cellValueChanged</code> — by the time <code>cellValueChanged</code> fires, the edit has ALREADY been applied to the grid; <code>cellValueChanged</code> is for reacting to a committed change, not preventing an invalid one.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueSetterParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Employee { name: string; salary: number; status: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgGridAngular],
  template: \`
    <h3>Editable cells — typed editor + validating valueSetter</h3>
    <ag-grid-angular
      style="height: 250px; width: 100%;"
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      (cellValueChanged)="onCellValueChanged($event)" />
    <p>Last rejected edit: {{ rejectedMessage() }}</p>
  \`,
})
export class App {
  rowData = signal<Employee[]>([
    { name: 'Alice', salary: 85000, status: 'Active' },
    { name: 'Bilal', salary: 72000, status: 'Inactive' },
  ]);

  rejectedMessage = signal('(none yet)');

  columnDefs: ColDef[] = [
    { field: 'name' },
    {
      field: 'salary',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      // valueSetter: apply the edit through OUR signal update, and reject negatives
      valueSetter: (params: ValueSetterParams) => {
        const newSalary = Number(params.newValue);
        if (isNaN(newSalary) || newSalary < 0) {
          this.rejectedMessage.set(\`Rejected: \${params.newValue} is not a valid salary\`);
          return false; // reject — old value stays
        }
        this.rowData.update(rows =>
          rows.map(r => r === params.data ? { ...r, salary: newSalary } : r),
        );
        return true;
      },
    },
    {
      field: 'status',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Active', 'Inactive'] },
    },
  ];

  onCellValueChanged(event: any) {
    console.log('Committed edit:', event.oldValue, '->', event.newValue, 'on', event.data);
  }
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
  <head><title>Editable cells and value setters</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Double-click the salary cell and try entering -500, then a valid number like 90000 — confirm the rejection message appears for the negative value and the grid correctly updates for the valid one.',
    hint: 'The valueSetter checks isNaN(newSalary) || newSalary < 0 and returns false for negative/invalid values, setting rejectedMessage — for valid values it updates rowData via .update() and returns true.',
    solution: `// No code change needed — this confirms the existing valueSetter logic:
// negative/NaN salaries are rejected (old value kept, message shown),
// valid salaries are applied through rowData.update() so the signal
// stays in sync with what the grid displays.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'making a column editable: true automatically keeps an Angular signal holding rowData in sync.',
      reality: 'by default, editing mutates params.data[field] directly on the row object — if rowData is a signal you treat as immutable elsewhere, this direct mutation silently desyncs the signal from what the grid actually shows unless you handle it via valueSetter.',
    },
    {
      thought: 'cellValueChanged is the right place to reject an invalid edit and prevent it from being applied.',
      reality: 'by the time cellValueChanged fires, the edit has ALREADY been committed — valueSetter (returning false) is the correct hook for rejecting an edit before it is applied.',
    },
    {
      thought: 'a plain text editable: true cell is sufficient for any data type, including numbers and enums.',
      reality: 'typed editors like agNumberCellEditor and agSelectCellEditor (with cellEditorParams: { values }) provide the correct input UI and constrain what a user can even type, which a plain text editor does not.',
    },
  ];
}
