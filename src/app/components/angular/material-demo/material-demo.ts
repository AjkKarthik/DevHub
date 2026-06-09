import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

interface TableRow { name: string; position: string; salary: string; }

@Component({
  selector: 'app-material-demo',
  imports: [
    FormsModule,
    MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatSlideToggleModule, MatProgressBarModule,
    MatIconModule, MatTableModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './material-demo.html',
  styleUrl: './material-demo.scss',
})
export class MaterialDemo {
  darkMode   = signal(false);
  progress   = signal(60);
  inputValue = signal('');

  tableColumns = ['name', 'position', 'salary'];
  tableData: TableRow[] = [
    { name: 'Alice',   position: 'Frontend Dev', salary: '$95k'  },
    { name: 'Bob',     position: 'Backend Dev',  salary: '$100k' },
    { name: 'Charlie', position: 'DevOps',       salary: '$110k' },
    { name: 'Diana',   position: 'UX Designer',  salary: '$90k'  },
  ];

  chips = ['Angular', 'TypeScript', 'RxJS', 'Signals'];
  removeChip(chip: string) { this.chips = this.chips.filter(c => c !== chip); }

  decreaseProgress() { this.progress.update(v => Math.max(0, v - 10)); }
  increaseProgress() { this.progress.update(v => Math.min(100, v + 10)); }

  qna: QnaItem[] = [
    { q: 'How do you set up Angular Material in a standalone app?', a: 'Run <code>ng add @angular/material</code>. It adds <code>provideAnimationsAsync()</code> to <code>app.config.ts</code> and a theme to <code>styles.scss</code>. Import individual component modules like <code>MatButtonModule</code> in each standalone component.' },
    { q: 'How do you show a snackbar notification?', a: '<code>inject(MatSnackBar).open(\'Saved!\', \'Dismiss\', { duration: 3000 })</code>. The snackbar appears at the bottom (or wherever configured). Add <code>MatSnackBarModule</code> to imports or ensure <code>provideAnimationsAsync()</code> is in providers.' },
    { q: 'How do you open a Material dialog and pass data to it?', a: '<code>inject(MatDialog).open(MyDialogComponent, { data: { id: 5 } })</code>. Inside the dialog, inject <code>MAT_DIALOG_DATA</code>: <code>private data = inject(MAT_DIALOG_DATA)</code>. Close with <code>inject(MatDialogRef).close(result)</code>.' },
    { q: 'How do you use MatTable with a signal-based data source?', a: 'Convert signal to Observable: <code>dataSource = toObservable(this.items)</code>. Or use a <code>MatTableDataSource</code> and update its <code>data</code> property inside an <code>effect()</code>. MatSort and MatPaginator must be wired after view init.' },
    { q: 'How do you customise the Material theme?', a: 'Angular Material 3 uses CSS custom properties. Override in your global styles: <code>--mat-app-primary: #6366f1</code>. Or define a full theme with <code>mat.define-theme()</code> in SCSS and apply with <code>mat.all-component-themes()</code>.' },
    { q: 'Can Material components be used without animations?', a: 'Yes — use <code>provideNoopAnimations()</code> instead of <code>provideAnimationsAsync()</code>. Components work but without transitions. Useful in unit tests (<code>NoopAnimationsModule</code>) to avoid async animation timing issues.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Angular Material setup',
      points: [
        'ng add @angular/material installs the package, sets up a theme, and adds provideAnimationsAsync().',
        'All Material components are standalone — import MatButtonModule, MatCardModule, etc. individually.',
        'provideAnimationsAsync() enables animations globally — required for dialogs, snackbar, and expansion panels.',
        'Material theming uses CSS custom properties (design tokens) — customise via theme.scss.',
      ],
    },
    {
      heading: 'Common components',
      points: [
        'MatFormField wraps input, select, and textarea with label, hint, and error display slots.',
        'MatSnackBar.open(message, action, { duration }) shows temporary toast notifications.',
        'MatDialog.open(MyDialogComponent, { data }) passes data to the dialog via MAT_DIALOG_DATA token.',
        'MatTable + dataSource renders a sortable, paginated table with minimal setup.',
      ],
    },
    {
      heading: 'Forms integration',
      points: [
        'MatInput directive enhances native <input> — use formControlName inside a MatFormField.',
        'MatAutocomplete overlays a panel of options as you type — pairs with formControl and switchMap.',
        'MatSelect replaces <select> with a Material overlay panel — supports multiple, grouping, and search.',
        'MatChipGrid + MatChipInput creates a chips input field compatible with reactive forms.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Never mix Material and custom SCSS on the same element — specificity conflicts cause hard-to-debug styles.',
        'mat-icon uses the Material Symbols font — add the <link> to index.html or use MatIconRegistry.',
        'MatPaginator + MatSort must be set AFTER data loads — use AfterViewInit or signal effect.',
        'Use MatThemingService or CSS variables for runtime theme switching (light/dark).',
      ],
    },
  ];

  materialTabs: CodeTab[] = [
    {
      label: 'Install + Theme setup',
      language: 'typescript',
      code: `
// 1. Install
// npm install @angular/material @angular/cdk @angular/animations

// 2. styles.scss — add the theme
@use '@angular/material' as mat;
@include mat.core();

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$red-palette,
  ),
  density: (scale: 0),
));

html { @include mat.all-component-themes($theme); }

// 3. app.config.ts — add animations provider
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),   // <-- required for Material
  ]
};`,
    },
    {
      label: 'Import + use in component',
      language: 'typescript',
      code: `
// Import only what you need — Angular Material is tree-shakeable
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatTableModule }     from '@angular/material/table';
import { FormsModule }        from '@angular/forms';

@Component({
  imports: [
    FormsModule,
    MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatTableModule,
  ],
  template: \`
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="save()">Save</button>
      </mat-card-content>
    </mat-card>
  \`,
})
export class MyComponent {
  name = '';
  save() { console.log(this.name); }
}`,
    },
    {
      label: 'Common components',
      language: 'html',
      code: `
<!-- Buttons -->
<button mat-flat-button color="primary">Flat</button>
<button mat-raised-button color="accent">Raised</button>
<button mat-stroked-button color="warn">Stroked</button>
<button mat-icon-button><mat-icon>star</mat-icon></button>
<button mat-fab><mat-icon>add</mat-icon></button>

<!-- Form field (wraps any input) -->
<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput type="email" [(ngModel)]="email" />
  <mat-hint>We won't share your email.</mat-hint>
  <mat-error>Invalid email</mat-error>
</mat-form-field>

<!-- Table -->
<table mat-table [dataSource]="data">
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef>Name</th>
    <td mat-cell *matCellDef="let row">{{ row.name }}</td>
  </ng-container>
  <tr mat-header-row *matHeaderRowDef="columns"></tr>
  <tr mat-row *matRowDef="let row; columns: columns;"></tr>
</table>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which provider must be added to app.config.ts for Angular Material dialogs, snackbars, and expansion panels to animate correctly?', options: ['provideRouter(routes)', 'provideAnimationsAsync()', 'provideHttpClient()', 'provideNoopAnimations()'], answer: 1, explanation: 'provideAnimationsAsync() enables the BrowserAnimationsModule asynchronously. Material overlays like dialogs and snackbars rely on Angular animations to open and close; without it they still render but without transitions.' },
    { q: 'In a mat-table, what directive marks the template for each data cell in a column?', options: ['*matHeaderCellDef', '*matRowDef', '*matCellDef', '*matColumnDef'], answer: 2, explanation: '*matCellDef is placed on the <td> template to define the data cell for a column. *matHeaderCellDef defines the header cell, *matRowDef defines which columns each row renders, and matColumnDef names the column container.' },
    { q: 'How do you pass data into a MatDialog component and read it inside that dialog?', options: ['Pass an @Input() property on the dialog component and set it after open() returns', 'Open with MatDialog.open(MyDialog, { data: { id: 5 } }) and inject MAT_DIALOG_DATA inside the dialog', 'Use a shared service with a BehaviorSubject before calling open()', 'Provide data via the dialog\'s constructor through the providers array on @Component'], answer: 1, explanation: 'MatDialog.open() accepts a config object with a data property. Inside the dialog component, inject the MAT_DIALOG_DATA token to access that object. This is the canonical, type-safe pattern documented by Angular Material.' },
    { q: 'What is the correct HTML structure to display a character count hint below a Material input?', options: ['<input matInput> followed by a plain <span> after the mat-form-field', '<mat-form-field><input matInput /><mat-hint>N characters</mat-hint></mat-form-field>', '<mat-form-field><input matInput /><mat-error>N characters</mat-error></mat-form-field>', '<mat-form-field hint=\'N characters\'><input matInput /></mat-form-field>'], answer: 1, explanation: 'mat-hint is a named slot inside mat-form-field that renders helper text beneath the input. mat-error is reserved for validation messages and only appears when the control is in an invalid, touched state.' },
    { q: 'Which Angular Material 3 approach is recommended for runtime light/dark theme switching?', options: ['Toggle a CSS class and override styles with !important in component SCSS', 'Reinstall the Material package with a different palette at build time', 'Override CSS custom properties (design tokens) such as --mat-app-primary at runtime, or use a theme CSS class', 'Import both MatLightThemeModule and MatDarkThemeModule and switch providers'], answer: 2, explanation: 'Angular Material 3 exposes its design system through CSS custom properties. Swapping those variables (or toggling a class that redefines them) at runtime is the supported pattern. There are no separate light/dark modules to import.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'MatButtonModule', type: 'class', desc: 'Provides mat-button directives (mat-flat-button, mat-raised-button, mat-stroked-button, mat-icon-button, mat-fab) for Material-styled buttons.', since: '2' },
    { name: 'MatFormField', type: 'directive', desc: 'Wrapper component that gives inputs, selects, and textareas a Material label, hint, error, and outline/fill appearance.', since: '2' },
    { name: 'matInput', type: 'directive', desc: 'Applied to a native <input> or <textarea> inside a mat-form-field to enable Material styling and accessibility.', since: '2' },
    { name: 'MatTableModule', type: 'class', desc: 'Provides the mat-table component plus cell, header-cell, and row definition directives for data-driven tables.', since: '5' },
    { name: 'MatDialog', type: 'class', desc: 'Injectable service whose open() method launches a component inside a Material overlay dialog, accepting optional data and config.', since: '2' },
    { name: 'MAT_DIALOG_DATA', type: 'token', desc: 'Injection token used inside a dialog component to access the data object passed via MatDialog.open(Component, { data }).', since: '2' },
    { name: 'MatSnackBar', type: 'class', desc: 'Injectable service that shows temporary toast-style notifications via its open(message, action, config) method.', since: '2' },
    { name: 'provideAnimationsAsync', type: 'function', desc: 'Application provider that lazily enables BrowserAnimationsModule — required for Material overlays, dialogs, and expansion panels to animate.', since: '17' },
    { name: 'MatChipsModule', type: 'class', desc: 'Provides mat-chip-set, mat-chip, and mat-chip-grid components for displaying and editing removable chip tags.', since: '2' },
    { name: 'MatSlideToggle', type: 'directive', desc: 'A toggle switch component that integrates with both template-driven and reactive forms for boolean on/off states.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Providing animations: NgModule vs standalone provider',
      before: `// app.module.ts (NgModule era)
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
  imports: [BrowserAnimationsModule]
})
export class AppModule {}`,
      after: `// app.config.ts (standalone / Angular 17+)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()]
};`,
      note: 'provideAnimationsAsync() loads animations lazily, reducing initial bundle size.',
    },
    {
      title: 'Injecting services: constructor vs inject()',
      before: `// Old constructor injection pattern
export class MyComponent {
  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}
}`,
      after: `// Modern inject() function (Angular 14+)
import { inject } from '@angular/core';
export class MyComponent {
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);
}`,
      note: 'inject() works at field-initializer level and is usable in standalone functions and directives.',
    },
    {
      title: 'Chip list: deprecated MatChipList vs MatChipGrid',
      before: `<!-- Old: MatChipList (deprecated in Material 15) -->
<mat-chip-list>
  <mat-chip *ngFor='let c of chips' (removed)='remove(c)'>{{c}}</mat-chip>
</mat-chip-list>`,
      after: `<!-- New: MatChipSet for display, MatChipGrid for form input -->
<mat-chip-set>
  <mat-chip *ngFor='let c of chips' (removed)='remove(c)'
            [removable]='true'>
    {{c}}<button matChipRemove><mat-icon>cancel</mat-icon></button>
  </mat-chip>
</mat-chip-set>`,
      note: 'MatChipList was removed in Angular Material 17; use MatChipSet (display) or MatChipGrid (form input).',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting provideAnimationsAsync() causes silent failures',
      wrong: `// app.config.ts — no animation provider
export const appConfig = {
  providers: [provideRouter(routes)]
};`,
      right: `export const appConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync()
  ]
};`,
      explanation: 'Without an animations provider, dialogs, snackbars, and expansion panels open instantly without transitions and may throw ExpressionChangedAfterItHasBeenChecked errors in tests.',
    },
    {
      title: 'Using matInput outside a mat-form-field',
      wrong: `<!-- standalone matInput — no label, hint, or error slots -->
<input matInput [(ngModel)]='email' />`,
      right: `<mat-form-field appearance='outline'>
  <mat-label>Email</mat-label>
  <input matInput [(ngModel)]='email' />
  <mat-error>Required</mat-error>
</mat-form-field>`,
      explanation: 'matInput is only meaningful inside mat-form-field; outside it loses label, hint, error display, and the Material underline/outline styling.',
    },
    {
      title: 'Setting MatPaginator/MatSort before the view initializes',
      wrong: `export class MyComp {
  @ViewChild(MatSort) sort!: MatSort;
  ds = new MatTableDataSource(data);
  // assigned in constructor — sort is undefined here
  constructor() { this.ds.sort = this.sort; }
}`,
      right: `export class MyComp implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  ds = new MatTableDataSource(data);
  ngAfterViewInit() { this.ds.sort = this.sort; }
}`,
      explanation: 'ViewChild references are only populated after the view is initialized. Assigning them earlier leaves the reference undefined and sorting/pagination silently does nothing.',
    },
    {
      title: 'Importing entire Material packages instead of individual modules',
      wrong: `// Imports the whole library — breaks tree-shaking
import { MaterialModule } from './material.module';`,
      right: `// Import only what you need per component
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule }   from '@angular/material/card';`,
      explanation: 'Angular Material is designed to be tree-shakeable via individual entry points. A barrel \'MaterialModule\' that re-exports everything prevents the bundler from dropping unused components.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: 'Angular Material 17',
      label: 'MDC-based components GA + MatChipList removed',
      features: [
        'All components migrated to MDC (Material Design Components) foundation for M3 compliance',
        'MatChipList fully removed — migrate to MatChipSet (display) or MatChipGrid (forms)',
        'provideAnimationsAsync() introduced as the recommended standalone provider',
        'CSS custom properties (design tokens) become the primary theming API',
      ],
    },
    {
      version: 'Angular Material 15',
      label: 'Material Design 3 (M3) theme system',
      features: [
        'mat.define-theme() SCSS function replaces define-light-theme/define-dark-theme',
        'density scale support added to theme configuration',
        'Design token CSS variables exposed for runtime overrides',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'Build a Searchable Material Table',
    description: 'Create a standalone Angular component that displays a mat-table of employees and lets the user filter rows by typing into a mat-form-field. The table must show three columns: name, role, and department. Filtering should be case-insensitive and update the displayed rows as the user types.',
    language: 'typescript',
    hints: [
      'Import MatTableModule, MatFormFieldModule, MatInputModule, and FormsModule in your component\'s imports array.',
      'Keep a master employees array and a filtered copy; update the filtered copy inside a method called on every (ngModelChange) event.',
      'Use the mat-table [dataSource] binding with your filtered array — no MatTableDataSource needed for simple filtering.',
      'Wrap each column with <ng-container matColumnDef=\'colName\'> and remember both *matHeaderCellDef and *matCellDef templates, plus the header and data row definitions at the bottom of the table.',
    ],
    starterCode: `import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

interface Employee { name: string; role: string; department: string; }

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [
    // TODO: add the required modules here
  ],
  template: \`
    <!-- TODO: add a mat-form-field with a text input that filters the table -->

    <!-- TODO: add a mat-table bound to filteredEmployees -->
    <!-- Columns: name | role | department -->
  \`,
})
export class EmployeeTableComponent {
  filterText = '';

  columns = ['name', 'role', 'department'];

  employees: Employee[] = [
    { name: 'Alice',   role: 'Frontend Dev', department: 'Engineering' },
    { name: 'Bob',     role: 'Backend Dev',  department: 'Engineering' },
    { name: 'Carol',   role: 'UX Designer',  department: 'Design'      },
    { name: 'David',   role: 'DevOps',       department: 'Engineering' },
    { name: 'Eve',     role: 'Product Owner',department: 'Product'     },
  ];

  filteredEmployees: Employee[] = [...this.employees];

  // TODO: implement applyFilter() — filter employees by filterText (case-insensitive)
  applyFilter() {

  }
}`,
    solution: `import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

interface Employee { name: string; role: string; department: string; }

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: \`
    <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
      <mat-label>Filter employees</mat-label>
      <input matInput [(ngModel)]="filterText" (ngModelChange)="applyFilter()" placeholder="Search by name, role, or department" />
      <mat-hint>{{ filteredEmployees.length }} of {{ employees.length }} employees shown</mat-hint>
    </mat-form-field>

    <table mat-table [dataSource]="filteredEmployees" style="width:100%">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>

      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Role</th>
        <td mat-cell *matCellDef="let row">{{ row.role }}</td>
      </ng-container>

      <ng-container matColumnDef="department">
        <th mat-header-cell *matHeaderCellDef>Department</th>
        <td mat-cell *matCellDef="let row">{{ row.department }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  \`,
})
export class EmployeeTableComponent {
  filterText = '';

  columns = ['name', 'role', 'department'];

  employees: Employee[] = [
    { name: 'Alice',   role: 'Frontend Dev',  department: 'Engineering' },
    { name: 'Bob',     role: 'Backend Dev',   department: 'Engineering' },
    { name: 'Carol',   role: 'UX Designer',   department: 'Design'      },
    { name: 'David',   role: 'DevOps',        department: 'Engineering' },
    { name: 'Eve',     role: 'Product Owner', department: 'Product'     },
  ];

  filteredEmployees: Employee[] = [...this.employees];

  applyFilter() {
    const term = this.filterText.toLowerCase().trim();
    if (!term) {
      this.filteredEmployees = [...this.employees];
      return;
    }
    this.filteredEmployees = this.employees.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.role.toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term)
    );
  }
}`,
  };
}
