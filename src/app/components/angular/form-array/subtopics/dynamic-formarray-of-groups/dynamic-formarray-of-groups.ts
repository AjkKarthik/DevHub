import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dynamic-formarray-of-groups-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dynamic-formarray-of-groups.html',
  styleUrl: './dynamic-formarray-of-groups.scss',
})
export class DynamicFormarrayOfGroupsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A FormArray of FormGroups — one row, several fields',
      points: [
        'A <code>FormArray</code> of plain <code>FormControl</code>s works for a list of single values (phone numbers, tags). The moment each ROW needs MULTIPLE fields — a name AND a level, a street AND a city — each array element needs to be a whole <code>FormGroup</code>, not a bare control.',
        '<code>fb.array([this.createSkill()])</code> where <code>createSkill()</code> returns <code>fb.group({ name: [\'\', Validators.required], level: [\'Beginner\'] })</code> — a FACTORY METHOD that consistently produces a correctly-shaped group every time you add a row, instead of repeating the group definition inline at every call site.',
      ],
    },
    {
      heading: 'Template wiring — formArrayName then formGroupName per row',
      points: [
        'Wrap the repeating section in <code>div formArrayName="skills"</code> to scope the template to the array. Then, for EACH row, wrap it in <code>div [formGroupName]="$index"</code> — this is the key difference from a FormArray of plain controls, which would instead bind each input directly via <code>[formControlName]="$index"</code> with no intermediate group wrapper.',
        'Inside that per-row <code>formGroupName</code> wrapper, inner inputs use plain <code>formControlName="name"</code> / <code>formControlName="level"</code> — exactly like any ordinary nested FormGroup, because at that point you genuinely are inside one.',
        'Iterate with <code>&#64;for (skill of skills.controls; track $index)</code> — <code>track</code> is required, and <code>$index</code> is a reasonable choice specifically for add/remove-at-the-end use cases.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form">
      <div formArrayName="skills">
        @for (skill of skills.controls; track $index) {
          <div [formGroupName]="$index" class="row">
            <input formControlName="name" placeholder="Skill name" />
            <select formControlName="level">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Expert</option>
            </select>
            <button type="button" (click)="removeSkill($index)">Remove</button>
          </div>
        }
      </div>
      <button type="button" (click)="addSkill()">Add skill</button>
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
  styles: [\`.row { display: flex; gap: .5rem; margin-bottom: .5rem; }\`],
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    skills: this.fb.array([this.createSkill()]),
  });

  get skills(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  // Factory method — every new row gets the exact same correct shape and validators
  private createSkill() {
    return this.fb.group({
      name: ['', Validators.required],
      level: ['Beginner'],
    });
  }

  addSkill() {
    this.skills.push(this.createSkill());
  }

  removeSkill(index: number) {
    this.skills.removeAt(index);
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
  <head><title>FormArray of FormGroups</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Guard the Remove button so it only shows when there is more than one skill row — the form should always have at least one skill.',
    hint: 'Wrap the remove button in @if (skills.length > 1) { <button type="button" (click)="removeSkill($index)">Remove</button> } — skills.length reads the current number of controls in the FormArray.',
    solution: `@if (skills.length > 1) {
  <button type="button" (click)="removeSkill($index)">Remove</button>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a FormArray of FormGroups is wired in the template the same way as a FormArray of plain FormControls — just [formControlName]="$index" for everything.',
      reality: 'a FormArray of FormGroups needs an EXTRA wrapping level per row — [formGroupName]="$index" — with plain formControlName="field" bindings INSIDE that wrapper. A FormArray of bare controls skips that extra level entirely and binds [formControlName]="$index" directly.',
    },
    {
      thought: 'defining the group shape inline at every push() call is just as maintainable as a factory method.',
      reality: 'a factory method (createSkill()) guarantees every new row has the exact same fields and validators — inlining the group definition at multiple call sites (initial array, push(), any reset/repopulate logic) risks the shapes silently drifting apart over time.',
    },
    {
      thought: 'you can push a plain JavaScript object directly into a FormArray, the same as pushing into a regular array.',
      reality: 'a FormArray only accepts AbstractControl instances — you must wrap a new row with fb.group({...}) (or fb.control() for a scalar) before pushing; pushing a raw object breaks change detection and validation entirely.',
    },
  ];
}
