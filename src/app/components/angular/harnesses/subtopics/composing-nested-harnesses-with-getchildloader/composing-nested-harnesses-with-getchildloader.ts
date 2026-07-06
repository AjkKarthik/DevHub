import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-composing-nested-harnesses-with-getchildloader-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './composing-nested-harnesses-with-getchildloader.html',
  styleUrl: './composing-nested-harnesses-with-getchildloader.scss',
})
export class ComposingNestedHarnessesWithGetchildloaderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line mention, actually built out',
      points: [
        'The main Harnesses page\'s "Best practices" section has exactly one bullet on this: "Use getChildLoader(selector) to create a sub-harness-loader scoped to a sub-tree — useful for composite components with repeated regions (e.g. each row in a table)." It never shows the actual pattern. Real composite components (a data table with rows, an accordion with panels, a tab group with tabs) are exactly where a FLAT harness API breaks down — you need to query "the Edit button inside row 3" specifically, not just "any Edit button in the whole component."',
      ],
    },
    {
      heading: 'locatorForAll() returning HARNESSES, not elements',
      points: [
        'The main topic\'s custom harness example uses <code>this.locatorForAll(\'.star\')</code> to get raw <code>TestElement</code> handles. For a COMPOSITE structure, pass a HARNESS CLASS instead of a CSS string: <code>this.locatorForAll(RowHarness)</code> returns an array of fully-functional <code>RowHarness</code> instances, one per matching child — each with its OWN scoped locators, exactly like the parent\'s.',
        'This composes RECURSIVELY — a <code>RowHarness</code> can itself use <code>this.locatorForAll(CellHarness)</code> or <code>this.locatorFor(EditButtonHarness)</code> for structures nested even deeper (a row containing an expandable detail panel with its own harness, for instance). Each harness only knows about its own local sub-tree — the table harness never needs to know a row\'s internal DOM, and a row harness never needs to know the table\'s.',
      ],
    },
    {
      heading: 'getChildLoader() — a scoped loader for imperative composition',
      points: [
        'When you need a full <code>HarnessLoader</code> scoped to a sub-tree (rather than a single locator), <code>await parentHarness.getChildLoader(\'.row-container\')</code> returns a loader whose subsequent <code>getHarness()</code>/<code>getAllHarnesses()</code> calls only search WITHIN that sub-tree — this is the imperative equivalent of the declarative <code>locatorForAll(RowHarness)</code> pattern above, useful when you need MULTIPLE different harness types scoped to the same region (e.g. both a row harness AND a checkbox harness, both scoped to "row 3" specifically).',
        '<code>getChildLoader()</code> accepts either a CSS selector string (scoping by DOM structure) — the loader still searches its own descendants for ANY harness type requested afterward, unlike a single-purpose locator that\'s pre-bound to one harness class.',
      ],
    },
    {
      heading: 'Filtering a specific nested instance with HarnessPredicate',
      points: [
        'Combine composition with filtering: <code>await table.getHarness(RowHarness.with(&#123; name: \'Alice\' &#125;))</code> finds the ONE row whose custom predicate matches, then every subsequent call on that returned <code>RowHarness</code> instance (<code>row.clickEditButton()</code>, <code>row.getStatus()</code>) is automatically scoped to just that row — no manual index bookkeeping, no risk of accidentally interacting with a different row after a re-sort changes row order.',
        'This is significantly more resilient than the naive alternative of <code>(await table.getAllHarnesses(RowHarness))[2]</code> — an index-based lookup breaks silently if the table\'s sort order changes between when the index was chosen and when the test runs, while a predicate-based lookup always finds the row matching the actual DATA, regardless of its current position.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/row-harness.ts',
      content: `import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface RowHarnessFilters {
  name?: string;
}

// Scoped to a SINGLE row — has no knowledge of the table that contains it.
export class RowHarness extends ComponentHarness {
  static hostSelector = 'tr.data-row';

  static with(options: RowHarnessFilters = {}): HarnessPredicate<RowHarness> {
    return new HarnessPredicate(RowHarness, options)
      .addOption('name', options.name,
        (harness, name) => HarnessPredicate.stringMatches(harness.getName(), name));
  }

  private nameCell = this.locatorFor('.name-cell');
  private statusCell = this.locatorFor('.status-cell');
  private editButton = this.locatorFor('button.edit');

  async getName(): Promise<string> {
    return (await this.nameCell()).text();
  }

  async getStatus(): Promise<string> {
    return (await this.statusCell()).text();
  }

  async clickEditButton(): Promise<void> {
    await (await this.editButton()).click();
  }
}
`,
    },
    {
      path: 'src/app/table-harness.ts',
      content: `import { ComponentHarness } from '@angular/cdk/testing';
import { RowHarness } from './row-harness';

export class DataTableHarness extends ComponentHarness {
  static hostSelector = 'app-data-table';

  // locatorForAll(RowHarness) — not a CSS string — returns an array of
  // fully-functional RowHarness instances, each scoped to its own <tr>.
  getRows = this.locatorForAll(RowHarness);

  async getRowCount(): Promise<number> {
    return (await this.getRows()).length;
  }

  // Predicate-based lookup — finds the row by DATA (name), not by index,
  // so it stays correct even if the table's sort order changes.
  async getRowByName(name: string): Promise<RowHarness> {
    return this.locatorFor(RowHarness.with({ name }))();
  }
}
`,
    },
    {
      path: 'src/app/data-table.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DataTableComponent } from './data-table.component';
import { DataTableHarness } from './table-harness';

describe('DataTableComponent with a composed harness', () => {
  async function setup() {
    const fixture = TestBed.createComponent(DataTableComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const table = await loader.getHarness(DataTableHarness);
    return { fixture, table };
  }

  it('reports the correct row count via a composed harness', async () => {
    const { table } = await setup();
    expect(await table.getRowCount()).toBe(3);
  });

  it('reads a specific row\\'s status by name, not by index', async () => {
    const { table } = await setup();
    const row = await table.getRowByName('Alice');
    expect(await row.getStatus()).toBe('Active');
  });

  it('clicking a specific row\\'s edit button only affects that row', async () => {
    const { fixture, table } = await setup();
    const row = await table.getRowByName('Bob');

    await row.clickEditButton();
    fixture.detectChanges();

    // The harness scoping guarantees this click targeted Bob's row
    // specifically, regardless of Bob's current position in the table.
    expect(fixture.componentInstance.editingRowName()).toBe('Bob');
  });
});
`,
    },
    {
      path: 'src/app/data-table.component.ts',
      content: `import { Component, signal } from '@angular/core';

interface Row { name: string; status: string; }

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: \`
    <table>
      <tbody>
        @for (row of rows(); track row.name) {
          <tr class="data-row">
            <td class="name-cell">{{ row.name }}</td>
            <td class="status-cell">{{ row.status }}</td>
            <td><button class="edit" (click)="editingRowName.set(row.name)">Edit</button></td>
          </tr>
        }
      </tbody>
    </table>
  \`,
})
export class DataTableComponent {
  rows = signal<Row[]>([
    { name: 'Alice', status: 'Active' },
    { name: 'Bob', status: 'Pending' },
    { name: 'Carol', status: 'Active' },
  ]);
  editingRowName = signal<string | null>(null);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DataTableComponent } from './data-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DataTableComponent],
  template: \`
    <h3>Composing nested harnesses with getChildLoader</h3>
    <p>Open data-table.component.spec.ts — DataTableHarness.getRows() returns an array
    of fully-functional RowHarness instances via locatorForAll(RowHarness), and
    getRowByName() uses a HarnessPredicate to find a row by data, not by index.</p>
    <app-data-table />
  \`,
})
export class App {}
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
  <head><title>Composing Nested Harnesses with getChildLoader</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a <code>getAllRowNames(): Promise&lt;string[]&gt;</code> method to <code>DataTableHarness</code> that returns every row\'s name in the CURRENT DOM order, using the existing <code>getRows()</code> locator.',
    hint: 'Call await this.getRows() to resolve the array of RowHarness instances, then map over it calling row.getName() on each (remember each call is async, so use Promise.all with the mapped array of promises).',
    solution: `async getAllRowNames(): Promise<string[]> {
  const rows = await this.getRows();
  return Promise.all(rows.map(row => row.getName()));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>locatorForAll()</code> only works with CSS selector strings, returning raw <code>TestElement</code> handles.',
      reality: 'passing a HARNESS CLASS instead of a string — locatorForAll(RowHarness) — returns an array of fully-functional harness instances, each scoped to its own matching sub-tree, composing recursively to any depth.',
    },
    {
      thought: 'finding a specific row in a table harness by array index (<code>(await table.getAllHarnesses(RowHarness))[2]</code>) is just as reliable as filtering by a predicate.',
      reality: 'index-based lookup silently breaks if the table\'s sort order changes between when the index was chosen and when the test runs — a HarnessPredicate-based lookup (RowHarness.with({ name })) always finds the row matching the actual data, regardless of its current position.',
    },
    {
      thought: 'a child harness (like RowHarness) needs some way to reference or navigate back up to its parent table harness.',
      reality: 'each harness only knows about its own local sub-tree — a row harness has zero knowledge of the table containing it, and the table harness never needs to know a row\'s internal DOM. This one-directional scoping is what makes the composition maintainable.',
    },
  ];
}
