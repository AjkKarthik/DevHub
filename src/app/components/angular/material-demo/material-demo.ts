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
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

interface TableRow { name: string; position: string; salary: string; }

@Component({
  selector: 'app-material-demo',
  imports: [
    FormsModule,
    MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatSlideToggleModule, MatProgressBarModule,
    MatIconModule, MatTableModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './material-demo.html',
  styleUrl: './material-demo.scss',
})
export class MaterialDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Angular CDK', route: '/angular/cdk-demo' },
  ];

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

  theory: TheoryPoint[] = [
    {
      heading: 'Angular Material setup and theming',
      points: [
        '<code>ng add @angular/material</code> installs the package, adds a pre-built theme to <code>styles.scss</code>, and wires <code>provideAnimationsAsync()</code> into <code>app.config.ts</code> — a one-command setup.',
        'All Material components are <strong>standalone-compatible</strong> — import individual modules (<code>MatButtonModule</code>, <code>MatCardModule</code>, etc.) directly in each component\'s <code>imports</code> array. No <code>NgModule</code> required.',
        '<code>provideAnimationsAsync()</code> is required in <code>app.config.ts</code> providers. Without it, dialogs, snackbars, and expansion panels open without animations and may throw <code>ExpressionChangedAfterChecked</code> errors.',
        'Angular Material uses the CDK (<code>@angular/cdk</code>) as its foundation — installing Material also installs CDK. You can use CDK primitives independently for custom-styled behaviour without Material\'s visual layer.',
        'The schematic sets up either a pre-built theme (auto-applied CSS) or a SCSS theme. Pre-built themes (<code>indigo-pink.css</code>, <code>deeppurple-amber.css</code>) are the fastest start; custom SCSS themes with <code>mat.define-theme()</code> give full control.',
      ],
    },
    {
      heading: 'Form fields, inputs, and validation',
      points: [
        '<code>MatFormField</code> wraps any <code>matInput</code>, <code>mat-select</code>, or <code>mat-textarea</code> with a floating label, placeholder, hint text, and error display — it is the cornerstone of all Material form controls.',
        'Three appearance options on <code>mat-form-field</code>: <code>fill</code> (default, Material Design 3), <code>outline</code> (bordered), and legacy <code>standard</code>. Set <code>appearance</code> globally via <code>MAT_FORM_FIELD_DEFAULT_OPTIONS</code>.',
        '<code>&lt;mat-error&gt;</code> inside a form field shows validation messages automatically when the <code>FormControl</code> is in the <code>invalid</code> + <code>touched</code> state. No <code>@if</code> needed — Material handles the display logic.',
        '<code>MatSelect</code> replaces <code>&lt;select&gt;</code> with a Material overlay panel that supports grouping, multiple selection, and custom option templates. Pair with <code>FormControl</code> and reactive forms.',
        '<code>MatAutocomplete</code> overlays suggestion options as the user types into a <code>matInput</code>. Wire it with <code>[matAutocomplete]="auto"</code> on the input, filter options in a <code>computed()</code> or <code>switchMap</code>, and provide results as an <code>Observable</code> or array.',
      ],
    },
    {
      heading: 'Common components — buttons, cards, dialogs, snackbars',
      points: [
        'Button directives: <code>mat-flat-button</code> (filled), <code>mat-raised-button</code> (elevated shadow), <code>mat-stroked-button</code> (outlined), <code>mat-button</code> (text), <code>mat-icon-button</code> (icon only), <code>mat-fab</code> (floating action). All accept <code>color="primary|accent|warn"</code>.',
        '<code>MatSnackBar.open(message, action, { duration: 3000 })</code> shows a temporary toast at the bottom of the screen. Handle the action with <code>.afterDismissed().subscribe()</code> to detect if the user clicked the action button.',
        '<code>MatDialog.open(MyDialogComponent, { data: {...} })</code> opens a component in a modal overlay. Pass data in the config; inject <code>MAT_DIALOG_DATA</code> inside the dialog to read it. Close via <code>inject(MatDialogRef).close(result)</code>.',
        '<code>MatCard</code> is a surface container with optional header (<code>mat-card-header</code>), content (<code>mat-card-content</code>), and actions (<code>mat-card-actions</code>) slots. Use it as a consistent content grouping element.',
        '<code>mat-icon</code> renders icons from the Material Symbols font. Add the <code>&lt;link&gt;</code> tag to <code>index.html</code> or register custom icon sets via <code>MatIconRegistry</code> for SVG icons.',
      ],
    },
    {
      heading: 'MatTable — data display, sorting, and pagination',
      points: [
        '<code>mat-table [dataSource]="data"</code> renders a data table from an array, Observable, or <code>MatTableDataSource</code>. Define each column with <code>&lt;ng-container matColumnDef="name"&gt;</code> containing <code>*matHeaderCellDef</code> and <code>*matCellDef</code> templates.',
        '<code>MatTableDataSource</code> wraps your data array and integrates with <code>MatSort</code> and <code>MatPaginator</code> for client-side sorting and pagination. Set <code>dataSource.sort = this.sort</code> and <code>dataSource.paginator = this.paginator</code> in <code>ngAfterViewInit</code>.',
        'Wire <code>MatSort</code>: add <code>matSort</code> directive to the table, <code>mat-sort-header</code> to each header cell, and <code>@ViewChild(MatSort) sort!</code> in the component. Always assign to the data source in <code>ngAfterViewInit</code> — never in the constructor.',
        '<code>MatPaginator</code>: add <code>&lt;mat-paginator [pageSize]="10"&gt;</code> below the table. Wire with <code>dataSource.paginator = this.paginator</code> in <code>ngAfterViewInit</code>. Set server-side page size by listening to <code>page</code> events and reloading data.',
        'For server-side data: use a custom <code>DataSource&lt;T&gt;</code> class (from <code>@angular/cdk/collections</code>) implementing <code>connect()</code> and <code>disconnect()</code>. <code>connect()</code> returns an Observable that emits when data changes (after sort/page events).',
      ],
    },
    {
      heading: 'Material Design 3 (M3) theming with design tokens',
      points: [
        'Angular Material 3 (MD3) replaces the MD2 theming system. Define a theme with <code>mat.define-theme()</code> instead of the old <code>mat.define-light-theme()</code>/<code>mat.define-dark-theme()</code> functions.',
        'MD3 theming uses CSS custom properties (<strong>design tokens</strong>) rather than SCSS-only variables. All token values like <code>--mat-app-primary</code>, <code>--mat-button-filled-container-color</code> can be overridden at runtime in CSS.',
        'Define a combined light + dark theme by passing <code>theme-type: light</code> and a separate <code>theme-type: dark</code> block: <code>&#64;include mat.all-component-themes($light-theme)</code> and <code>.dark-theme { &#64;include mat.all-component-themes($dark-theme) }</code>.',
        'Runtime theme switching: toggle a CSS class on <code>&lt;body&gt;</code> (e.g. <code>.dark-theme</code>) or swap CSS custom property values via JavaScript. No re-render of Angular components needed — it\'s pure CSS.',
        'Color palettes: MD3 uses a set of tonal palettes generated from a seed color. Pass <code>primary: mat.$red-palette</code> (or a custom palette from <code>mat.m2-define-palette()</code>) to generate the full set of on-color, container, and surface tokens.',
      ],
    },
    {
      heading: 'Testing, accessibility, and performance',
      points: [
        'Use <code>provideNoopAnimations()</code> (or <code>NoopAnimationsModule</code>) in test beds. Material animations make tests non-deterministic — no-op replaces them with synchronous no-ops, making component tests deterministic.',
        'All Material components follow WCAG 2.1 AA. <code>mat-form-field</code> auto-wires ARIA labels; <code>MatDialog</code> traps focus and manages <code>aria-modal</code>; buttons and inputs have correct roles. Always add <code>aria-label</code> to icon-only buttons.',
        'Tree-shake Material by importing individual modules per component, never a barrel <code>MaterialModule</code>. Angular\'s build system drops unused component code when entry points are granular.',
        'Avoid using both Material AND global resets (e.g. Bootstrap\'s <code>normalize.css</code>) — they conflict on element styles. Material applies its own baseline via <code>mat.core()</code>.',
        'For large tables: prefer server-side pagination over client-side. <code>MatTableDataSource.filterPredicate</code> can be overridden for custom filter logic without re-fetching from the server.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Install + Theme',
      language: 'typescript',
      code: `// 1. Install
ng add @angular/material
// Runs the schematic: installs packages, sets up theme, wires providers

// 2. styles.scss — custom SCSS theme (M3 API)
@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (
    theme-type: light,           // or 'dark'
    primary: mat.$red-palette,
  ),
  density: (scale: 0),
));

html { @include mat.all-component-themes($theme); }

// Light + dark switching by class:
html { @include mat.all-component-themes($light-theme); }
html.dark { @include mat.all-component-themes($dark-theme); }

// 3. app.config.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),    // required for Material overlays
  ],
};`,
    },
    {
      label: 'Components',
      language: 'html',
      code: `<!-- Buttons -->
<button mat-flat-button color="primary">Flat</button>
<button mat-raised-button color="accent">Raised</button>
<button mat-stroked-button color="warn">Stroked</button>
<button mat-icon-button aria-label="Favourite"><mat-icon>favorite</mat-icon></button>
<button mat-fab aria-label="Add"><mat-icon>add</mat-icon></button>

<!-- Form field with validation -->
<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput type="email" [formControl]="emailCtrl" />
  <mat-hint>We won't share your email.</mat-hint>
  <mat-error>Enter a valid email address</mat-error>
</mat-form-field>

<!-- Card -->
<mat-card>
  <mat-card-header><mat-card-title>Profile</mat-card-title></mat-card-header>
  <mat-card-content>Card body content here.</mat-card-content>
  <mat-card-actions><button mat-button>View</button></mat-card-actions>
</mat-card>`,
    },
    {
      label: 'Dialog + Snackbar',
      language: 'typescript',
      code: `import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';

// Dialog host component
@Component({ ... })
export class HostComponent {
  private dialog  = inject(MatDialog);
  private snack   = inject(MatSnackBar);

  openDialog() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Delete this item?' },
      width: '400px',
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snack.open('Item deleted', 'Undo', { duration: 4000 });
      }
    });
  }
}

// Dialog component
@Component({
  template: \`
    <h2 mat-dialog-title>{{ data.message }}</h2>
    <mat-dialog-actions>
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Delete</button>
    </mat-dialog-actions>
  \`
})
export class ConfirmDialogComponent {
  data    = inject<{ message: string }>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}`,
    },
    {
      label: 'MatTable + Sort',
      language: 'typescript',
      code: `import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { AfterViewInit, viewChild } from '@angular/core';

interface Employee { name: string; role: string; salary: number; }

@Component({
  imports: [MatTableModule, MatSortModule, MatPaginatorModule],
  template: \`
    <table mat-table matSort [dataSource]="dataSource">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>
      <!-- ...more columns... -->
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
    <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" />
  \`
})
export class TableDemo implements AfterViewInit {
  columns    = ['name', 'role', 'salary'];
  sort       = viewChild.required(MatSort);
  paginator  = viewChild.required(MatPaginator);
  dataSource = new MatTableDataSource<Employee>([...]);

  ngAfterViewInit() {
    // MUST assign after view init — not in constructor
    this.dataSource.sort      = this.sort();
    this.dataSource.paginator = this.paginator();
  }

  applyFilter(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.dataSource.filter = term.trim().toLowerCase();
  }
}`,
    },
    {
      label: 'Theming (M3)',
      language: 'typescript',
      code: `// styles.scss — full M3 theme with light and dark variants
@use '@angular/material' as mat;

// M3 light theme
$light: mat.define-theme((
  color: (
    theme-type: light,
    primary:  mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
  typography: (plain-family: 'Inter, sans-serif'),
  density: (scale: 0),
));

// M3 dark theme
$dark: mat.define-theme((
  color: (
    theme-type: dark,
    primary:  mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

html        { @include mat.all-component-themes($light); }
html.dark   { @include mat.all-component-themes($dark); }

// Runtime toggle (in Angular component):
// document.documentElement.classList.toggle('dark', isDark);

// Override a single design token at runtime via CSS:
// :root { --mat-button-filled-container-color: #6366f1; }`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which provider must be in app.config.ts for Material dialogs, snackbars, and expansion panels to animate?',
      options: ['provideRouter(routes)', 'provideAnimationsAsync()', 'provideHttpClient()', 'provideNoopAnimations()'],
      answer: 1,
      explanation: 'provideAnimationsAsync() enables the animation engine lazily. Material overlays like dialogs and snackbars rely on Angular animations; without it they still render but without transitions and may cause ExpressionChangedAfterChecked errors.',
    },
    {
      q: 'In a mat-table, which directive marks the template for each data cell in a column?',
      options: ['*matHeaderCellDef', '*matRowDef', '*matCellDef', '*matColumnDef'],
      answer: 2,
      explanation: '*matCellDef is placed on the <td> template to define the data cell for a column. *matHeaderCellDef defines the header cell, *matRowDef defines which columns each row renders, and matColumnDef names the column container.',
    },
    {
      q: 'How do you pass data into a MatDialog component and read it inside the dialog?',
      options: ['Pass an @Input() property and set it after open() returns', 'Open with MatDialog.open(MyDialog, { data: {...} }) and inject MAT_DIALOG_DATA inside the dialog', 'Use a shared service with a BehaviorSubject before calling open()', 'Provide data via the providers array on the dialog\'s @Component'],
      answer: 1,
      explanation: 'MatDialog.open() accepts a config object with a data property. Inside the dialog component, inject the MAT_DIALOG_DATA token to access that object. Close with inject(MatDialogRef).close(result).',
    },
    {
      q: 'What is the correct structure to show a hint below a Material input?',
      options: ['<input matInput> followed by a <span> after the mat-form-field', '<mat-form-field><input matInput /><mat-hint>helper text</mat-hint></mat-form-field>', '<mat-form-field><input matInput /><mat-error>helper text</mat-error></mat-form-field>', '<mat-form-field hint="helper text"><input matInput /></mat-form-field>'],
      answer: 1,
      explanation: 'mat-hint is the named slot inside mat-form-field for helper text rendered beneath the input. mat-error is reserved for validation messages and only displays when the control is invalid and touched.',
    },
    {
      q: 'When must you assign MatSort and MatPaginator to a MatTableDataSource?',
      options: ['In the constructor, before the data is loaded', 'In ngOnInit, as soon as the component initialises', 'In ngAfterViewInit, after ViewChild references are populated', 'In the template using two-way binding on the [dataSource] input'],
      answer: 2,
      explanation: 'ViewChild references (MatSort, MatPaginator) are only populated after the view is initialised. Assigning them in the constructor or ngOnInit leaves the reference undefined, so sorting and pagination silently do nothing.',
    },
    {
      q: 'What is the Angular Material 3 (M3) recommended approach for runtime light/dark theme switching?',
      options: ['Toggle a CSS class and override styles with !important in component SCSS', 'Reinstall the Material package with a different palette at build time', 'Toggle a CSS class on <html> or override CSS custom properties (design tokens) at runtime', 'Import both MatLightThemeModule and MatDarkThemeModule and switch providers at runtime'],
      answer: 2,
      explanation: 'Angular Material 3 exposes its design system via CSS custom properties. Toggling a class that applies a different @include mat.all-component-themes() ruleset, or directly swapping token variables, is the supported pattern.',
    },
    {
      q: 'What is the difference between MatChipSet and MatChipGrid in Angular Material 17+?',
      options: ['MatChipSet is for a single chip; MatChipGrid is for multiple chips', 'MatChipSet is for display-only chips; MatChipGrid is for form-input chips (chip input field)', 'MatChipGrid is deprecated — always use MatChipSet', 'They are identical — MatChipGrid is an alias for MatChipSet'],
      answer: 1,
      explanation: 'MatChipSet renders chips for display purposes (read-only or removable tags). MatChipGrid is for form input — it pairs with MatChipInput to allow users to type and add new chips, integrating with reactive forms. MatChipList was removed in Material 17.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'How do you set up Angular Material in a standalone app?', a: 'Run <code>ng add @angular/material</code>. It adds <code>provideAnimationsAsync()</code> to <code>app.config.ts</code> and a theme to <code>styles.scss</code>. Import individual component modules like <code>MatButtonModule</code> in each standalone component\'s <code>imports</code> array.' },
    { q: 'How do you show a snackbar notification?', a: '<code>inject(MatSnackBar).open(\'Saved!\', \'Dismiss\', { duration: 3000 })</code>. The snackbar appears at the bottom of the screen. Subscribe to <code>.afterDismissed()</code> to detect if the user clicked the action button.' },
    { q: 'How do you open a Material dialog and pass data to it?', a: '<code>inject(MatDialog).open(MyDialogComponent, { data: { id: 5 } })</code>. Inside the dialog, inject <code>MAT_DIALOG_DATA</code>: <code>private data = inject(MAT_DIALOG_DATA)</code>. Close with <code>inject(MatDialogRef).close(result)</code>.' },
    { q: 'How do you use MatTable with a sortable MatTableDataSource?', a: 'Create <code>dataSource = new MatTableDataSource(data)</code>. Get <code>@ViewChild(MatSort) sort!</code> and assign in <code>ngAfterViewInit()</code>: <code>this.dataSource.sort = this.sort</code>. Add <code>matSort</code> to the table and <code>mat-sort-header</code> to each header cell.' },
    { q: 'How do you customise the Material theme?', a: 'Angular Material 3 uses CSS custom properties. Define a theme with <code>mat.define-theme()</code> in SCSS and apply with <code>mat.all-component-themes($theme)</code>. Override design tokens at runtime: <code>document.documentElement.style.setProperty(\'--mat-app-primary\', \'#6366f1\')</code>.' },
    { q: 'Can Material components be used without animations?', a: 'Yes — use <code>provideNoopAnimations()</code> instead of <code>provideAnimationsAsync()</code>. Components work but without transitions. Always use <code>NoopAnimationsModule</code> / <code>provideNoopAnimations()</code> in unit tests to avoid async animation timing issues.' },
    { q: 'How do you add server-side pagination to a MatTable?', a: 'Create a custom <code>DataSource&lt;T&gt;</code> class (from <code>@angular/cdk/collections</code>) implementing <code>connect()</code> and <code>disconnect()</code>. <code>connect()</code> returns an Observable that fetches data from the API. Subscribe to <code>MatPaginator.page</code> events to trigger new API calls and update the data stream.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'MatButtonModule', type: 'class', desc: 'Provides mat-flat-button, mat-raised-button, mat-stroked-button, mat-icon-button, and mat-fab directives.', since: '2' },
    { name: 'MatFormField', type: 'directive', desc: 'Wrapper that gives inputs, selects, and textareas a Material label, hint, error display, and outline/fill appearance.', since: '2' },
    { name: 'matInput', type: 'directive', desc: 'Applied to a native <input> or <textarea> inside mat-form-field to enable Material styling and accessibility wiring.', since: '2' },
    { name: 'MatTableModule', type: 'class', desc: 'Provides mat-table component plus *matCellDef, *matHeaderCellDef, and *matRowDef structural directives.', since: '5' },
    { name: 'MatTableDataSource', type: 'class', desc: 'Wraps an array for mat-table with built-in sort, pagination, and filter via MatSort/MatPaginator integration.', since: '5' },
    { name: 'MatDialog', type: 'class', desc: 'Injectable service whose open() launches a component in a modal overlay — accepts optional data config.', since: '2' },
    { name: 'MAT_DIALOG_DATA', type: 'token', desc: 'Injection token used inside a dialog component to access the data object passed via MatDialog.open().', since: '2' },
    { name: 'MatSnackBar', type: 'class', desc: 'Injectable service showing temporary toast-style notifications via open(message, action, config).', since: '2' },
    { name: 'MatSort / matSort', type: 'directive', desc: 'Directive + service that enable column sorting on a mat-table when wired to a MatTableDataSource in ngAfterViewInit.', since: '5' },
    { name: 'MatChipSet / MatChipGrid', type: 'directive', desc: 'MatChipSet for display-only chips; MatChipGrid for form-input chips paired with MatChipInput (Material 17+).', since: '2' },
    { name: 'provideAnimationsAsync', type: 'function', desc: 'Registers the animation engine lazily — required for all Material overlays, dialogs, and expansion panels.', since: '17' },
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
  providers: [provideAnimationsAsync()]   // lazy-loaded animations
};`,
      note: 'provideAnimationsAsync() loads animations lazily, reducing initial bundle size vs the eager BrowserAnimationsModule.',
    },
    {
      title: 'Injecting Material services: constructor vs inject()',
      before: `// Old constructor injection
export class MyComponent {
  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}
}`,
      after: `// Modern inject() function — usable in standalone functions too
import { inject } from '@angular/core';
export class MyComponent {
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);
}`,
      note: 'inject() works at field-initializer level and composes with standalone directives and functional interceptors.',
    },
    {
      title: 'Chip list: deprecated MatChipList vs MatChipSet (Material 17+)',
      before: `<!-- Old: MatChipList removed in Material 17 -->
<mat-chip-list>
  <mat-chip *ngFor="let c of chips" (removed)="remove(c)">{{ c }}</mat-chip>
</mat-chip-list>`,
      after: `<!-- New: MatChipSet for display, MatChipGrid for form input -->
<mat-chip-set>
  @for (c of chips; track c) {
    <mat-chip (removed)="remove(c)">
      {{ c }}
      <button matChipRemove aria-label="Remove"><mat-icon>cancel</mat-icon></button>
    </mat-chip>
  }
</mat-chip-set>`,
      note: 'MatChipList was removed in Angular Material 17. Use MatChipSet for display and MatChipGrid for form input.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting provideAnimationsAsync() causes silent dialog/snackbar failures',
      wrong: `// app.config.ts — no animation provider
export const appConfig = {
  providers: [provideRouter(routes)]
  // dialogs open without animations; snackbars may not dismiss
};`,
      right: `export const appConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync()   // required for all Material overlays
  ]
};`,
      explanation: 'Without an animations provider, dialogs and snackbars open instantly without transitions and may throw ExpressionChangedAfterItHasBeenChecked errors in tests.',
    },
    {
      title: 'Using matInput outside a mat-form-field',
      wrong: `<!-- matInput alone has no label, hint, or error slots -->
<input matInput [(ngModel)]="email" />`,
      right: `<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput [(ngModel)]="email" />
  <mat-error>Required</mat-error>
</mat-form-field>`,
      explanation: 'matInput is only meaningful inside mat-form-field. Outside it, you lose the floating label, hint text, error display, and Material outline/fill styling.',
    },
    {
      title: 'Assigning MatSort/MatPaginator in the constructor instead of ngAfterViewInit',
      wrong: `export class MyComp {
  @ViewChild(MatSort) sort!: MatSort;
  ds = new MatTableDataSource(data);
  constructor() { this.ds.sort = this.sort; } // sort is undefined here
}`,
      right: `export class MyComp implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  ds = new MatTableDataSource(data);
  ngAfterViewInit() { this.ds.sort = this.sort; } // populated now
}`,
      explanation: 'ViewChild references are only populated after the view initialises. Assigning them earlier leaves them undefined and sorting/pagination silently does nothing.',
    },
    {
      title: 'Importing a barrel MaterialModule that bundles everything',
      wrong: `// Imports ALL of Material — breaks tree-shaking
import { MaterialModule } from './material.module';
@Component({ imports: [MaterialModule] })`,
      right: `// Import only what you need — fully tree-shakeable
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule }   from '@angular/material/card';
@Component({ imports: [MatButtonModule, MatCardModule] })`,
      explanation: 'Angular Material is designed to be tree-shakeable via individual entry points. A barrel module that re-exports everything prevents the bundler from dropping unused components and inflates the bundle by hundreds of KB.',
    },
    {
      title: 'Not using mat-error for validation messages — showing them manually instead',
      wrong: `<mat-form-field appearance="outline">
  <input matInput [formControl]="emailCtrl" />
</mat-form-field>
@if (emailCtrl.invalid && emailCtrl.touched) {
  <p class="error">Invalid email</p>
}`,
      right: `<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput [formControl]="emailCtrl" />
  <mat-error>Invalid email</mat-error>
</mat-form-field>
<!-- mat-error appears automatically when invalid + touched -->`,
      explanation: 'mat-error inside mat-form-field is display-controlled by Material — it appears only when the FormControl is invalid and touched, with correct spacing and color. Manual error paragraphs break the form field layout and accessibility.',
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
    { name: 'Alice',  role: 'Frontend Dev',  department: 'Engineering' },
    { name: 'Bob',    role: 'Backend Dev',   department: 'Engineering' },
    { name: 'Carol',  role: 'UX Designer',   department: 'Design'      },
    { name: 'David',  role: 'DevOps',        department: 'Engineering' },
    { name: 'Eve',    role: 'Product Owner', department: 'Product'     },
  ];

  filteredEmployees: Employee[] = [...this.employees];

  // TODO: implement applyFilter() — filter by filterText (case-insensitive)
  applyFilter() {}
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
  imports: [FormsModule, MatTableModule, MatFormFieldModule, MatInputModule],
  template: \`
    <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
      <mat-label>Filter employees</mat-label>
      <input matInput [(ngModel)]="filterText" (ngModelChange)="applyFilter()"
             placeholder="Search by name, role, or department" />
      <mat-hint>{{ filteredEmployees.length }} of {{ employees.length }} shown</mat-hint>
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
    { name: 'Alice',  role: 'Frontend Dev',  department: 'Engineering' },
    { name: 'Bob',    role: 'Backend Dev',   department: 'Engineering' },
    { name: 'Carol',  role: 'UX Designer',   department: 'Design'      },
    { name: 'David',  role: 'DevOps',        department: 'Engineering' },
    { name: 'Eve',    role: 'Product Owner', department: 'Product'     },
  ];

  filteredEmployees: Employee[] = [...this.employees];

  applyFilter() {
    const term = this.filterText.toLowerCase().trim();
    this.filteredEmployees = term
      ? this.employees.filter(e =>
          e.name.toLowerCase().includes(term) ||
          e.role.toLowerCase().includes(term) ||
          e.department.toLowerCase().includes(term))
      : [...this.employees];
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular Material provides a complete set of MD3-compliant UI components built on CDK — install with ng add, import individual modules per component, wire provideAnimationsAsync(), and customise via CSS design tokens.',
    mustKnow: [
      '<code>ng add @angular/material</code> installs + wires everything; <code>provideAnimationsAsync()</code> in <code>app.config.ts</code> is required for dialogs, snackbars, and expansion panels',
      'Import individual modules per component (<code>MatButtonModule</code>, <code>MatCardModule</code>, etc.) — never a barrel <code>MaterialModule</code>',
      '<code>MatFormField</code> wraps <code>matInput</code> to provide labels, hints, and <code>mat-error</code> (auto-shows on invalid+touched state)',
      'Wire <code>MatSort</code> and <code>MatPaginator</code> to <code>MatTableDataSource</code> in <code>ngAfterViewInit()</code> — never in the constructor (ViewChild is undefined there)',
      '<code>MatDialog.open(Comp, { data })</code> + inject <code>MAT_DIALOG_DATA</code> inside dialog; <code>MatSnackBar.open(msg, action, { duration })</code> for toasts',
      'M3 theming uses <code>mat.define-theme()</code> + CSS custom properties (design tokens) — light/dark switching by toggling a class on <code>&lt;html&gt;</code>',
      '<code>MatChipList</code> removed in Material 17 — use <code>MatChipSet</code> (display) or <code>MatChipGrid</code> (form input)',
    ],
    interviewFocus: [
      'What is provideAnimationsAsync() and why is it required for Angular Material?',
      'How do you pass data into a MatDialog and read it inside the dialog component?',
      'Why must you wire MatSort/MatPaginator to MatTableDataSource in ngAfterViewInit?',
      'How does Angular Material 3 theming differ from Material 2, and how do you switch light/dark at runtime?',
      'What is the difference between mat-hint and mat-error inside a mat-form-field?',
    ],
  };
}
