import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-formarray-crud-patterns-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './formarray-crud-patterns.html',
  styleUrl: './formarray-crud-patterns.scss',
})
export class FormarrayCrudPatternsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Add and remove — the everyday operations',
      points: [
        'Add: <code>this.myArray.push(this.createItem())</code> — Angular renders the new row automatically through the <code>&#64;for</code> loop, no manual DOM work.',
        'Remove: <code>this.myArray.removeAt(index)</code> — the remaining controls\' INDICES SHIFT to close the gap; there is never a hole left in the array. Guard remove buttons with <code>myArray.length &gt; 1</code> whenever at least one item should always remain.',
      ],
    },
    {
      heading: 'Reorder — moveAt() (Angular 18+)',
      points: [
        '<code>myArray.moveAt(fromIndex, toIndex)</code> moves a control from one position to another WITHOUT manually reading and rewriting values at each position — a "move up"/"move down" button pair is as simple as <code>myArray.moveAt(i, i - 1)</code> / <code>myArray.moveAt(i, i + 1)</code>.',
      ],
    },
    {
      heading: 'Bulk replace from an API response — setControl()',
      points: [
        '<code>this.form.setControl(\'items\', this.fb.array(apiData.map(d =&gt; this.fb.group(d))))</code> replaces the ENTIRE array atomically in one call — building a brand-new <code>FormArray</code> from fetched data and swapping it in, rather than removing every existing control one at a time and pushing new ones individually.',
      ],
    },
    {
      heading: 'The reset() gotcha — it resets VALUES, not the number of controls',
      points: [
        '<code>form.reset()</code> resets every control\'s VALUE back to its initial value and clears touched/dirty — but it does NOT change how many controls exist in a <code>FormArray</code>. If the user added 5 rows and you call <code>form.reset()</code>, you still have 5 (now-blank) rows, not the original 1.',
        'To genuinely reset back to a starting count, trim manually after reset: <code>form.reset(); while (arr.length &gt; 1) arr.removeAt(1);</code> — reset the values first, then remove extra controls down to whatever the starting count should be.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form">
      <div formArrayName="items">
        @for (item of items.controls; track $index) {
          <div class="row">
            <input [formControlName]="$index" />
            <button type="button" (click)="moveUp($index)" [disabled]="$index === 0">↑</button>
            <button type="button" (click)="moveDown($index)" [disabled]="$index === items.length - 1">↓</button>
            @if (items.length > 1) {
              <button type="button" (click)="items.removeAt($index)">Remove</button>
            }
          </div>
        }
      </div>
      <button type="button" (click)="items.push(fb.control(''))">Add</button>
      <button type="button" (click)="loadFromApi()">Load from "API" (bulk replace)</button>
      <button type="button" (click)="resetAndTrim()">Reset to 1 item</button>
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
  styles: [\`.row { display: flex; gap: .3rem; margin-bottom: .3rem; }\`],
})
export class App {
  fb = inject(FormBuilder);

  form = this.fb.group({
    items: this.fb.array([this.fb.control('First item')]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  moveUp(i: number)   { if (i > 0) this.items.moveAt(i, i - 1); }
  moveDown(i: number) { if (i < this.items.length - 1) this.items.moveAt(i, i + 1); }

  loadFromApi() {
    const apiData = ['Fetched A', 'Fetched B', 'Fetched C'];
    // setControl() atomically replaces the whole array — no manual removeAt/push loop
    this.form.setControl('items', this.fb.array(apiData.map(v => this.fb.control(v))));
  }

  resetAndTrim() {
    this.form.reset({ items: ['First item'] }); // resets VALUES — length still whatever it was
    while (this.items.length > 1) this.items.removeAt(1); // manually trim back to 1
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
  <head><title>FormArray CRUD patterns</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Clear all" button that empties the items array down to ZERO controls (not reset to 1) — useful for a genuinely empty starting state.',
    hint: 'clearAll() { while (this.items.length > 0) this.items.removeAt(0); } — removeAt(0) repeatedly, always removing the first remaining control, until the array is empty.',
    solution: `clearAll() {
  while (this.items.length > 0) {
    this.items.removeAt(0);
  }
}

// Template:
// <button type="button" (click)="clearAll()">Clear all</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'removeAt() leaves a gap in the array\'s indices where the removed control used to be.',
      reality: 'the remaining controls\' indices always SHIFT to close the gap immediately — a FormArray\'s indices are always contiguous, starting at 0, with no holes, exactly like a normal JavaScript array after splice().',
    },
    {
      thought: 'form.reset() also resets a FormArray back to its ORIGINAL number of controls, not just their values.',
      reality: 'reset() only resets VALUES and touched/dirty state — it does not remove or add controls. If a FormArray grew to 5 items, calling reset() still leaves 5 (now blank) items; you must manually trim/pad the array to change its length.',
    },
    {
      thought: 'replacing a FormArray\'s entire contents from fresh API data requires removing every existing control one at a time and pushing new ones.',
      reality: 'form.setControl(\'items\', newFormArray) replaces the WHOLE array atomically in a single call — building a fresh FormArray from the new data and swapping it in is simpler and avoids the intermediate teardown/rebuild entirely.',
    },
  ];
}
