import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-typed-formarray-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './typed-formarray.html',
  styleUrl: './typed-formarray.scss',
})
export class TypedFormarraySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FormArray is typed by default too, same as FormGroup',
      points: [
        '<code>FormArray&lt;FormControl&lt;string&gt;&gt;</code> constrains exactly what can be PUSHED into it — TypeScript catches a shape mismatch (pushing a number control into a string array, say) at compile time, the same guarantee typed <code>FormGroup</code> gives you for named fields.',
        '<code>FormArray&lt;FormGroup&lt;{ name: FormControl&lt;string&gt;, level: FormControl&lt;string&gt; }&gt;&gt;</code> for an array of multi-field rows — the generic describes the shape of EVERY row, not just one field.',
      ],
    },
    {
      heading: 'FormBuilder infers the type — you rarely write it by hand',
      points: [
        '<code>fb.array([this.createSkill()])</code> INFERS the full <code>FormArray&lt;FormGroup&lt;...&gt;&gt;</code> type automatically from what <code>createSkill()</code> returns — you almost never write the generic explicitly. For a genuinely empty starting array with nothing to infer from, an explicit generic is needed: <code>fb.array&lt;FormControl&lt;string&gt;&gt;([])</code>.',
      ],
    },
    {
      heading: 'value vs getRawValue() — the same distinction, one level deeper',
      points: [
        '<code>formArray.value</code> returns a typed array reflecting only ENABLED controls; <code>formArray.getRawValue()</code> always includes every control regardless of disabled state — the exact same pattern covered for <code>FormGroup</code> earlier, just applied to each element of the array.',
      ],
    },
    {
      heading: 'Migrating older code — UntypedFormArray',
      points: [
        '<code>UntypedFormArray</code> exists as the same kind of migration bridge as <code>UntypedFormGroup</code>/<code>UntypedFormControl</code> — it preserves the old, loosely-typed (effectively <code>any</code>) behavior for gradually migrating a large codebase, and is not the recommended long-term choice for new code.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form">
      <div formArrayName="tags">
        @for (tag of tags.controls; track $index) {
          <input [formControlName]="$index" placeholder="Tag" />
        }
      </div>
      <button type="button" (click)="addTag()">Add tag</button>
    </form>
    <!-- form.controls.tags is FormArray<FormControl<string>> — fully typed -->
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    // Explicit generic needed here since the starting array is empty — nothing to infer from
    tags: this.fb.array<FormControl<string>>([
      this.fb.control('angular', { nonNullable: true, validators: Validators.required }),
    ]),
  });

  get tags() {
    return this.form.controls.tags;
  }

  addTag() {
    // TypeScript enforces this must be a FormControl<string> — a mismatched type is a compile error
    this.tags.push(this.fb.control('', { nonNullable: true, validators: Validators.required }));
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
  <head><title>Typed FormArray</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second typed FormArray, "scores", of FormControl<number> — with an addScore() method that pushes a new numeric control defaulting to 0.',
    hint: 'scores = this.fb.array<FormControl<number>>([this.fb.control(0, { nonNullable: true })]); then addScore() { this.scores.push(this.fb.control(0, { nonNullable: true })); } — same explicit-generic pattern as the tags array, just with number instead of string.',
    solution: `form = this.fb.group({
  tags: this.fb.array<FormControl<string>>([
    this.fb.control('angular', { nonNullable: true, validators: Validators.required }),
  ]),
  scores: this.fb.array<FormControl<number>>([
    this.fb.control(0, { nonNullable: true }),
  ]),
});

get scores() { return this.form.controls.scores; }

addScore() {
  this.scores.push(this.fb.control(0, { nonNullable: true }));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FormArray is always loosely typed (effectively any), regardless of Angular version, unlike FormGroup.',
      reality: 'since Angular 14, FormArray is typed by DEFAULT, the same as FormGroup and FormControl — FormArray<FormControl<string>> constrains exactly what can be pushed, and TypeScript enforces it at compile time.',
    },
    {
      thought: 'you must always write out the full FormArray<T> generic explicitly, every time.',
      reality: 'FormBuilder INFERS the type automatically when there is something to infer from — e.g. fb.array([this.createSkill()]) infers the shape from createSkill()\'s return type. An explicit generic is only needed when starting from a genuinely empty array with nothing to infer.',
    },
    {
      thought: 'formArray.value and formArray.getRawValue() return the same typed array.',
      reality: 'the same value/getRawValue() distinction from FormGroup applies here too — .value reflects only enabled controls (and is typed accordingly), while .getRawValue() always includes every control regardless of disabled state.',
    },
  ];
}
