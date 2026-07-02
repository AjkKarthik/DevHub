import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-cell-renderers-angular-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-cell-renderers-angular-components.html',
  styleUrl: './custom-cell-renderers-angular-components.scss',
})
export class CustomCellRenderersAngularComponentsSubtopic {

  agGridDeps = { 'ag-grid-community': 'latest', 'ag-grid-angular': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'ICellRendererAngularComp — a real component, not just a callback',
      points: [
        'A callback <code>cellRenderer</code> returns a raw HTML string — fine for simple badges, but it cannot use Angular bindings, DI, or its own template. A cell renderer that IS an Angular component implements <code>ICellRendererAngularComp</code> instead, giving it a full Angular template, `inject()`, and change detection.',
        'The interface has two methods: <code>agInit(params: ICellRendererParams)</code> — called once when the cell renderer is created, where you read <code>params.value</code>/<code>params.data</code> into component fields — and <code>refresh(params): boolean</code> — called when the cell\'s underlying data changes; return <code>true</code> if you updated in place (AG Grid keeps the same component instance), or <code>false</code> to have AG Grid destroy and recreate it.',
      ],
    },
    {
      heading: 'Registering and passing extra data to the renderer',
      points: [
        '<code>{ field: \'status\', cellRenderer: StatusBadgeComponent }</code> — pass the CLASS itself (not an instance) as <code>cellRenderer</code>. AG Grid instantiates it internally for each cell, wiring up Angular\'s injector correctly.',
        '<code>cellRendererParams: { onAction: (row) => this.handleAction(row) }</code> lets you pass extra data/callbacks beyond the standard params — read them off <code>params.onAction</code> inside <code>agInit()</code>. This is the standard way to let a cell renderer trigger behavior back in the PARENT component (e.g. a delete button per row).',
      ],
    },
    {
      heading: 'When a plain callback is still the better choice',
      points: [
        'A full Angular component renderer has real overhead — one component instance PER VISIBLE CELL using that column. For a simple text transform or single-icon badge, a plain callback function (returning an HTML string) is both simpler and faster; reach for an Angular component renderer specifically when you need Angular bindings, event handlers, or nested child components inside the cell.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/status-badge.ts',
      content: `import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: \`
    <span [style.background]="color" style="padding: 0.2rem 0.6rem; border-radius: 999px; color: white; font-size: 0.8rem;">
      {{ label }}
    </span>
    <button (click)="onToggle()" style="margin-left: 0.5rem;">Toggle</button>
  \`,
})
export class StatusBadgeComponent implements ICellRendererAngularComp {
  label = '';
  color = '#999';
  private params!: ICellRendererParams & { onToggle?: (row: any) => void };

  agInit(params: ICellRendererParams & { onToggle?: (row: any) => void }): void {
    this.params = params;
    this.updateDisplay(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.updateDisplay(params.value);
    return true; // reuse this same component instance
  }

  private updateDisplay(value: string) {
    this.label = value;
    this.color = value === 'Active' ? '#22c55e' : '#ef4444';
  }

  onToggle() {
    this.params.onToggle?.(this.params.data);
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { StatusBadgeComponent } from './status-badge';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Employee { name: string; status: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgGridAngular],
  template: \`
    <h3>Angular component cell renderer with a click handler</h3>
    <ag-grid-angular
      style="height: 250px; width: 100%;"
      [rowData]="rowData()"
      [columnDefs]="columnDefs" />
  \`,
})
export class App {
  rowData = signal<Employee[]>([
    { name: 'Alice', status: 'Active' },
    { name: 'Bilal', status: 'Inactive' },
    { name: 'Chen', status: 'Active' },
  ]);

  columnDefs: ColDef[] = [
    { field: 'name' },
    {
      field: 'status',
      cellRenderer: StatusBadgeComponent,
      cellRendererParams: {
        onToggle: (row: Employee) => {
          this.rowData.update(rows =>
            rows.map(r => r === row ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r),
          );
        },
      },
    },
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
  <head><title>Custom cell renderers as Angular components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third status value, "Pending", with a yellow (#eab308) badge color, and cycle Active -> Inactive -> Pending -> Active on toggle.',
    hint: 'Update updateDisplay() to handle the new value/color mapping, and change the onToggle callback\'s logic to cycle through all three states instead of just two.',
    solution: `private updateDisplay(value: string) {
  this.label = value;
  this.color = value === 'Active' ? '#22c55e' : value === 'Pending' ? '#eab308' : '#ef4444';
}

// In app.ts's onToggle callback:
onToggle: (row: Employee) => {
  const next = { Active: 'Inactive', Inactive: 'Pending', Pending: 'Active' }[row.status];
  this.rowData.update(rows => rows.map(r => r === row ? { ...r, status: next! } : r));
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a cellRenderer must always be a plain callback function returning an HTML string.',
      reality: 'passing an Angular component CLASS as cellRenderer (implementing ICellRendererAngularComp) is fully supported and gives the cell a real Angular template, DI, and event handlers — a callback is only the simpler alternative.',
    },
    {
      thought: 'refresh() in ICellRendererAngularComp is optional boilerplate that can just return true unconditionally without doing anything.',
      reality: 'refresh() is where you must actually update the component\'s displayed state for the NEW params — returning true without updating anything means the cell silently shows stale data after an underlying value change.',
    },
    {
      thought: 'an Angular component cell renderer is always the better choice since it is more powerful than a callback.',
      reality: 'a full component instance is created PER VISIBLE CELL using that column, with real overhead — a plain callback remains the better choice for simple text/single-icon transforms.',
    },
  ];
}
