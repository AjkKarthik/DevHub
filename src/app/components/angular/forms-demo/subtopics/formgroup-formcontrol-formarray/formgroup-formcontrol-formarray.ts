import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-formgroup-formcontrol-formarray-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './formgroup-formcontrol-formarray.html',
  styleUrl: './formgroup-formcontrol-formarray.scss',
})
export class FormgroupFormcontrolFormarraySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FormControl — one value, one set of state flags',
      points: [
        '<code>FormControl</code> tracks a single input\'s value plus its validity, dirty/pristine, and touched/untouched state. Every leaf field in a reactive form — text input, checkbox, select — is ultimately backed by one <code>FormControl</code>, whether you created it explicitly or via <code>fb.control(...)</code>/the shorthand array syntax.',
      ],
    },
    {
      heading: 'FormGroup — a named dictionary of controls',
      points: [
        '<code>FormGroup</code> holds a dictionary of controls (keyed by field name) and aggregates their state: the GROUP is invalid if ANY child control is invalid, touched if ANY child has been touched, etc. This aggregation is what powers `[disabled]="form.invalid"` on a submit button — it reflects every field at once.',
        'Nest a <code>FormGroup</code> inside another to model a nested object shape — e.g. an <code>address</code> sub-object — and bind it in the template with <code>formGroupName="address"</code> wrapping the nested inputs.',
      ],
    },
    {
      heading: 'FormArray — an ordered, resizable list of controls',
      points: [
        '<code>FormArray</code> holds an ORDERED LIST of controls instead of a named dictionary — the natural fit for "add another phone number" / "add another address" UI, where the number of fields is not known upfront.',
        'Access an item by numeric INDEX, not by name: <code>phoneNumbers.at(0)</code>, or in the template with <code>formArrayName="phoneNumbers"</code> wrapping an <code>&#64;for</code> loop that binds each item by index.',
        'A <code>FormArray</code> item does not have to be a plain <code>FormControl</code> — it can just as easily be a whole nested <code>FormGroup</code>, e.g. a list of address objects, each with its own street/city/zip controls.',
      ],
    },
    {
      heading: 'All three share one base: AbstractControl',
      points: [
        '<code>FormControl</code>, <code>FormGroup</code>, and <code>FormArray</code> all extend <code>AbstractControl</code>, which is where <code>.value</code>, <code>.status</code>, <code>.errors</code>, <code>.valueChanges</code>, and methods like <code>.markAsTouched()</code> actually live. This is why the exact same validity-checking patterns (<code>touched && invalid</code>, <code>form.errors</code>) work identically whether you are looking at a single control, a group, or an array — invalidity anywhere in the tree propagates up through every ancestor.',
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
      <input formControlName="name" placeholder="Name" />

      <div formGroupName="address">
        <input formControlName="city" placeholder="City" />
      </div>

      <h4>Phone numbers</h4>
      <div formArrayName="phones">
        @for (phone of phones.controls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Phone" />
            <button type="button" (click)="removePhone($index)">Remove</button>
          </div>
        }
      </div>
      <button type="button" (click)="addPhone()">Add phone number</button>
    </form>

    <p>Form valid: {{ form.valid }}</p>
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', Validators.required],
    address: this.fb.group({
      city: [''],
    }),
    phones: this.fb.array([
      this.fb.control('', Validators.required),
    ]),
  });

  get phones(): FormArray {
    return this.form.get('phones') as FormArray;
  }

  addPhone() {
    this.phones.push(this.fb.control('', Validators.required));
  }

  removePhone(index: number) {
    this.phones.removeAt(index);
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
  <head><title>FormGroup, FormControl, FormArray</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a minLength(1) validator at the FormArray level so the form is invalid whenever there are zero phone numbers — try removing the only phone entry and check form.valid becomes false.',
    hint: 'FormArray-level validators go as the SECOND argument to fb.array(): `this.fb.array([this.fb.control(\'\', Validators.required)], Validators.minLength(1))` — this validates the ARRAY\'s length itself, separate from each individual control\'s own validator.',
    solution: `phones = this.fb.array(
  [this.fb.control('', Validators.required)],
  Validators.minLength(1),
);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a FormArray can only contain plain FormControls, not nested FormGroups.',
      reality: 'a FormArray item can be ANY AbstractControl — a FormControl, or a whole nested FormGroup. A list of address objects (each with street/city/zip sub-fields) is a completely normal FormArray of FormGroups.',
    },
    {
      thought: 'a top-level form.invalid only reflects that form\'s own direct fields, not fields nested several levels deep inside FormGroups/FormArrays.',
      reality: 'invalidity propagates up through the ENTIRE control tree — a FormGroup or FormArray is invalid if ANY descendant control anywhere below it is invalid, no matter how deeply nested. form.invalid at the top always reflects the whole tree.',
    },
    {
      thought: 'you access a FormArray item in the template the same way as a FormGroup field, by name.',
      reality: 'FormArray items are accessed by NUMERIC INDEX — [formControlName]="$index" in a loop, or .at(index)/.removeAt(index) in the class — never by a string key, since a FormArray has no field names, only an ordered position.',
    },
  ];
}
