import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mattable-sorting-pagination-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mattable-sorting-pagination.html',
  styleUrl: './mattable-sorting-pagination.scss',
})
export class MattableSortingPaginationSubtopic {

  materialDeps = { '@angular/material': 'latest', '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'mat-table — column-definition-driven rendering',
      points: [
        '<code>mat-table [dataSource]="data"</code> renders a table from an array, an Observable, or a <code>MatTableDataSource</code>. Define each column with <code>&lt;ng-container matColumnDef="name"&gt;</code>, containing a <code>*matHeaderCellDef</code> template for the header cell and a <code>*matCellDef</code> template for each row\'s cell — the column definition is completely separate from row/header ORDERING, which you control with <code>displayedColumns</code>.',
      ],
    },
    {
      heading: 'MatTableDataSource — the integration point for sort and pagination',
      points: [
        '<code>MatTableDataSource</code> wraps a plain data array and integrates with <code>MatSort</code> and <code>MatPaginator</code> for CLIENT-SIDE sorting and pagination. Assign both: <code>dataSource.sort = this.sort</code> and <code>dataSource.paginator = this.paginator</code>.',
        'Always make those assignments in <code>ngAfterViewInit</code> — NEVER in the constructor. <code>MatSort</code>/<code>MatPaginator</code> are queried via <code>&#64;ViewChild</code>, and view children are not populated yet when the constructor runs; assigning too early silently fails to wire sorting/pagination at all.',
      ],
    },
    {
      heading: 'Wiring MatSort and MatPaginator',
      points: [
        'Sort: add the <code>matSort</code> directive to the table element, <code>mat-sort-header</code> to each sortable header cell, and <code>&#64;ViewChild(MatSort) sort!</code> in the component class.',
        'Pagination: add <code>&lt;mat-paginator [pageSize]="10"&gt;</code> below the table, and <code>&#64;ViewChild(MatPaginator) paginator!</code> in the class. For SERVER-SIDE page sizes, listen to the paginator\'s <code>page</code> event and re-fetch data for that page instead of relying on client-side slicing.',
      ],
    },
    {
      heading: 'Server-side data — a custom DataSource',
      points: [
        'For genuinely large datasets, implement <code>DataSource&lt;T&gt;</code> (from <code>&#64;angular/cdk/collections</code>) with your own <code>connect()</code> and <code>disconnect()</code> methods, instead of <code>MatTableDataSource</code>. <code>connect()</code> returns an Observable that emits a new page of rows whenever sort/page events fire — the table itself never holds the FULL dataset in memory, only the current page.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

interface Row { name: string; role: string; age: number; }

const DATA: Row[] = [
  { name: 'Ada',   role: 'Engineer', age: 34 },
  { name: 'Grace', role: 'Engineer', age: 41 },
  { name: 'Alan',  role: 'Researcher', age: 29 },
  { name: 'Linus', role: 'Engineer', age: 38 },
  { name: 'Ken',   role: 'Researcher', age: 45 },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule],
  template: \`
    <table mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
        <td mat-cell *matCellDef="let row">{{ row.role }}</td>
      </ng-container>
      <ng-container matColumnDef="age">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Age</th>
        <td mat-cell *matCellDef="let row">{{ row.age }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <mat-paginator [pageSize]="3"></mat-paginator>
  \`,
})
export class App implements AfterViewInit {
  displayedColumns = ['name', 'role', 'age'];
  dataSource = new MatTableDataSource<Row>(DATA);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    // MUST happen here, not in the constructor — @ViewChild is not populated yet then
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>MatTable sorting and pagination</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a filter input above the table that filters rows by name as the user types, using MatTableDataSource\'s built-in .filter property.',
    hint: '<input (input)="dataSource.filter = $any($event.target).value.trim().toLowerCase()" placeholder="Filter by name" /> — MatTableDataSource has a built-in filterPredicate that checks .filter against every field by default; setting .filter re-runs it automatically.',
    solution: `<input
  placeholder="Filter by name"
  (input)="dataSource.filter = $any($event.target).value.trim().toLowerCase()" />

<table mat-table [dataSource]="dataSource" matSort>
  <!-- ... unchanged ... -->
</table>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'assigning dataSource.sort/dataSource.paginator in the constructor works fine, since the class fields already exist.',
      reality: 'MatSort and MatPaginator are queried via @ViewChild, which is not populated until AFTER the view initializes — assigning in the constructor silently fails to wire sorting/pagination since sort/paginator are still undefined at that point. Always assign in ngAfterViewInit.',
    },
    {
      thought: 'MatTableDataSource works the same way regardless of dataset size — client-side sort/pagination scales to any amount of data.',
      reality: 'MatTableDataSource holds the FULL dataset in memory and sorts/paginates it client-side — for genuinely large datasets, a custom DataSource<T> with server-side connect()/disconnect() is the correct approach instead.',
    },
    {
      thought: 'mat-sort-header on a column automatically sorts by whatever field is displayed in that column\'s cells.',
      reality: 'mat-sort-header sorts by the matColumnDef NAME by default (e.g. "name", "age") — for columns whose sort key differs from what is displayed, MatTableDataSource\'s sortingDataAccessor must be customized to map the column id to the correct underlying value.',
    },
  ];
}
