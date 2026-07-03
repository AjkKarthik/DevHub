import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cdk-table-headless-data-table-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cdk-table-headless-data-table.html',
  styleUrl: './cdk-table-headless-data-table.scss',
})
export class CdkTableHeadlessDataTableSubtopic {

  cdkDeps = { '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'CdkTable — the data/rendering engine, zero built-in styling',
      points: [
        '<code>CdkTable</code> (from <code>@angular/cdk/table</code>) is the SAME underlying engine that powers <code>MatTable</code> — column definition, row rendering, and change-tracking logic — but with absolutely no CSS or visual markup opinions attached. You get a table\'s BEHAVIOR (efficient row diffing, column composition) without any of Material\'s look.',
        'Column definitions are declared with <code>cdkColumnDef</code>: <code>&lt;ng-container cdkColumnDef="name"&gt;&lt;th cdk-header-cell *cdkHeaderCellDef&gt;Name&lt;/th&gt;&lt;td cdk-cell *cdkCellDef="let row"&gt;{{ row.name }}&lt;/td&gt;&lt;/ng-container&gt;</code> — each column is a self-contained, REORDERABLE unit; changing the order in <code>displayedColumns</code> reorders the rendered table without touching the column definitions themselves.',
      ],
    },
    {
      heading: 'DataSource<T> — the data contract',
      points: [
        '<code>CdkTable</code> accepts data via a <code>DataSource&lt;T&gt;</code> — an abstract class with one required method, <code>connect(): Observable&lt;T[]&gt;</code>, plus a <code>disconnect()</code> cleanup hook. A plain array also works directly for simple cases (<code>[dataSource]="myArray"</code>), but a real <code>DataSource</code> subclass is where SORTING, PAGINATION, and server-side data fetching hook in.',
        'A custom <code>DataSource</code> commonly combines multiple Observable inputs (raw data, sort state, page state) with <code>combineLatest</code> inside its <code>connect()</code> method, so the table automatically re-renders whenever ANY of those inputs change — sort direction flips, page changes, filter text updates — all through the SAME single stream the table subscribes to.',
      ],
    },
    {
      heading: 'Sticky rows/columns and row templates',
      points: [
        '<code>sticky</code> on a header row definition (<code>*cdkHeaderRowDef="displayedColumns; sticky: true"</code>) pins the header to the top of a scrollable container using pure CSS <code>position: sticky</code> under the hood — no JavaScript scroll-listener hack required.',
        'Multiple row templates can coexist via <code>cdkRowDefWhen</code> — a predicate function that selects which row template to use per data item, enabling different visual treatments for e.g. a "highlighted" row vs a normal one, all within the same table.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';

interface Person { id: number; name: string; role: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CdkTableModule],
  template: \`
    <h3>CdkTable — same engine as MatTable, zero built-in styling</h3>
    <table cdk-table [dataSource]="people()" style="border-collapse: collapse; width: 100%;">

      <ng-container cdkColumnDef="id">
        <th cdk-header-cell *cdkHeaderCellDef style="border-bottom: 2px solid #333; text-align: left; padding: 0.5rem;">ID</th>
        <td cdk-cell *cdkCellDef="let row" style="border-bottom: 1px solid #ddd; padding: 0.5rem;">{{ row.id }}</td>
      </ng-container>

      <ng-container cdkColumnDef="name">
        <th cdk-header-cell *cdkHeaderCellDef style="border-bottom: 2px solid #333; text-align: left; padding: 0.5rem;">Name</th>
        <td cdk-cell *cdkCellDef="let row" style="border-bottom: 1px solid #ddd; padding: 0.5rem;">{{ row.name }}</td>
      </ng-container>

      <ng-container cdkColumnDef="role">
        <th cdk-header-cell *cdkHeaderCellDef style="border-bottom: 2px solid #333; text-align: left; padding: 0.5rem;">Role</th>
        <td cdk-cell *cdkCellDef="let row" style="border-bottom: 1px solid #ddd; padding: 0.5rem;">{{ row.role }}</td>
      </ng-container>

      <tr cdk-header-row *cdkHeaderRowDef="displayedColumns"></tr>
      <tr cdk-row *cdkRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <button (click)="reorderColumns()" style="margin-top: 1rem;">Swap Name/Role column order</button>
  \`,
})
export class App {
  people = signal<Person[]>([
    { id: 1, name: 'Alice', role: 'Engineer' },
    { id: 2, name: 'Bilal', role: 'Designer' },
    { id: 3, name: 'Chen', role: 'Product' },
  ]);

  displayedColumns = ['id', 'name', 'role'];

  reorderColumns() {
    // Reordering the array reorders the rendered table — no column def changes needed
    this.displayedColumns = ['id', 'role', 'name'];
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
  <head><title>CdkTable — headless data table</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth column, "email", to both the people data and a new cdkColumnDef, and include it in displayedColumns.',
    hint: 'Add email: string to the Person interface and data, add a new <ng-container cdkColumnDef="email"> block matching the pattern of the existing columns, and add \'email\' to the displayedColumns array.',
    solution: `interface Person { id: number; name: string; role: string; email: string; }

// New column block:
<ng-container cdkColumnDef="email">
  <th cdk-header-cell *cdkHeaderCellDef>Email</th>
  <td cdk-cell *cdkCellDef="let row">{{ row.email }}</td>
</ng-container>

displayedColumns = ['id', 'name', 'role', 'email'];`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CdkTable is a stripped-down, less capable version of MatTable meant only for simple cases.',
      reality: 'CdkTable IS the same underlying rendering/data engine that MatTable is built on — it has the same column composition and change-tracking capabilities, just with zero visual styling attached, making it the right choice when you need full design control.',
    },
    {
      thought: 'a DataSource<T> for CdkTable must always be a class with complex Observable composition, even for a simple static list.',
      reality: 'a plain array works directly with [dataSource] for simple cases — a custom DataSource subclass is specifically for when sorting, pagination, or server-side fetching need to hook into the table\'s data stream.',
    },
    {
      thought: 'sticky headers in CdkTable require a JavaScript scroll listener to reposition the header on scroll.',
      reality: 'the sticky option uses pure CSS position: sticky under the hood — no scroll-listener JavaScript is involved at all.',
    },
  ];
}
