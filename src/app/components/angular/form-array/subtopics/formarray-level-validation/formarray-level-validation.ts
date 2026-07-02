import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-formarray-level-validation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './formarray-level-validation.html',
  styleUrl: './formarray-level-validation.scss',
})
export class FormarrayLevelValidationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two separate layers of validation',
      points: [
        'ITEM-level validators (<code>Validators.required</code> on each control) live in the factory method that creates a row — they check each individual item\'s own value.',
        'ARRAY-level validators are a completely SEPARATE layer, checking something about the ARRAY AS A WHOLE — most commonly, that it has at least one item. These are passed as the SECOND argument to <code>fb.array([], [myMinLengthValidator])</code>, alongside the initial controls array, not mixed into any individual item\'s own validators.',
      ],
    },
    {
      heading: 'Writing an array-level validator',
      points: [
        'The validator function receives the <code>FormArray</code> itself as its <code>AbstractControl</code> argument — inspect <code>control.length</code> (the CURRENT number of controls) and return an error object or <code>null</code>: <code>(control: AbstractControl) =&gt; (control as FormArray).length &gt;= 1 ? null : { minLength: true }</code>.',
      ],
    },
    {
      heading: 'Reading the error — myArray.errors, not any item\'s errors',
      points: [
        'Access the array-level error in the template with <code>myArray.errors?.[\'minLength\']</code> — this error lives ON THE ARRAY, not on any individual item\'s own <code>.errors</code>. Checking a specific item\'s errors would never surface an array-level problem.',
      ],
    },
    {
      heading: 'Both layers combine — either one failing makes the array invalid',
      points: [
        'The array is <code>invalid</code> if EITHER its own array-level validator fails, OR any individual item\'s validator fails — the two layers combine exactly like nested <code>FormGroup</code> invalidity propagating up from any descendant control. Every item can be individually valid while the array itself is still invalid (too few items), and vice versa.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

// Array-level validator — receives the FormArray itself, checks its length
function minArrayLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const arr = control as FormArray;
    return arr.length >= min ? null : { minLength: { required: min, actual: arr.length } };
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form">
      <div formArrayName="attendees">
        @for (a of attendees.controls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Attendee name" />
            @if (a.touched && a.invalid) { <span>Required.</span> }
            <button type="button" (click)="attendees.removeAt($index)">Remove</button>
          </div>
        }
      </div>

      <!-- Array-level error — lives on attendees.errors, not any individual item -->
      @if (attendees.errors?.['minLength']) {
        <p>At least {{ attendees.errors!['minLength'].required }} attendee(s) required — currently {{ attendees.errors!['minLength'].actual }}.</p>
      }

      <button type="button" (click)="addAttendee()">Add attendee</button>
      <p>Array valid: {{ attendees.valid }} | Form valid: {{ form.valid }}</p>
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    // Array-level validator (min 1 item) as the SECOND argument to fb.array()
    attendees: this.fb.array(
      [this.fb.control('', Validators.required)], // item-level validator, per control
      minArrayLength(1),
    ),
  });

  get attendees(): FormArray {
    return this.form.get('attendees') as FormArray;
  }

  addAttendee() {
    this.attendees.push(this.fb.control('', Validators.required));
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
  <head><title>FormArray-level validation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a maxArrayLength(max) validator that makes the array invalid if it has MORE than `max` attendees, and combine it with minArrayLength(1) in the same validators array.',
    hint: 'function maxArrayLength(max: number) { return (control: AbstractControl): ValidationErrors | null => { const arr = control as FormArray; return arr.length <= max ? null : { maxLength: { max, actual: arr.length } }; }; } — then pass both as an array: fb.array([...], [minArrayLength(1), maxArrayLength(5)]).',
    solution: `function maxArrayLength(max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const arr = control as FormArray;
    return arr.length <= max ? null : { maxLength: { max, actual: arr.length } };
  };
}

attendees: this.fb.array(
  [this.fb.control('', Validators.required)],
  [minArrayLength(1), maxArrayLength(5)],
),`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'array-level validators (like requiring at least one item) automatically also validate each individual item\'s own fields.',
      reality: 'these are two completely SEPARATE layers — item-level validators live in the factory method that creates each row, while array-level validators check something about the array as a whole (like its length). Neither layer substitutes for the other.',
    },
    {
      thought: 'you can read an array-level error the same way as any item\'s error, by checking one of the individual controls\' .errors.',
      reality: 'an array-level error lives on myArray.errors — the ARRAY\'s own errors object — not on any individual item\'s .errors. Checking a specific item would never surface an array-level problem like "not enough items".',
    },
    {
      thought: 'once every individual item passes its own validators, the array as a whole is automatically valid.',
      reality: 'the array can still be INVALID due to its own array-level validator (e.g. requiring at least one item, or no more than N items) even when every individual item is independently perfectly valid — the two failure modes are completely independent.',
    },
  ];
}
