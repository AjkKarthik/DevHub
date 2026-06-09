import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-form-array',
  imports: [ReactiveFormsModule, JsonPipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './form-array.html',
  styleUrl: './form-array.scss',
})
export class FormArrayDemo {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name:   ['', Validators.required],
    emails: this.fb.array([this.createEmail()]),
    skills: this.fb.array([this.createSkill()]),
  });

  get emails(): FormArray { return this.form.get('emails') as FormArray; }
  get skills(): FormArray { return this.form.get('skills') as FormArray; }

  createEmail() {
    return this.fb.control('', [Validators.required, Validators.email]);
  }
  createSkill() {
    return this.fb.group({ name: ['', Validators.required], level: ['beginner'] });
  }

  addEmail()             { this.emails.push(this.createEmail()); }
  addSkill()             { this.skills.push(this.createSkill()); }
  removeEmail(i: number) { this.emails.removeAt(i); }
  removeSkill(i: number) { this.skills.removeAt(i); }

  submitted = false;

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted = true;
  }

  reset() {
    this.form.reset();
    while (this.emails.length > 1) this.emails.removeAt(1);
    while (this.skills.length > 1) this.skills.removeAt(1);
    this.submitted = false;
  }

  theory: TheoryPoint[] = [
    {
      heading: 'FormArray — dynamic field lists',
      points: [
        'FormArray holds an ordered list of AbstractControls — each element is a FormControl or FormGroup.',
        'fb.array([]) creates an empty typed array; fb.array([fb.group({...})]) initialises with items.',
        'formArray.push(control) adds to the end; formArray.removeAt(i) removes by index.',
        'In the template, iterate with formArray.controls and pass index to formControlName or formGroupName.',
      ],
    },
    {
      heading: 'Typed FormArray',
      points: [
        'FormArray<FormControl<string>> constrains what can be pushed — TypeScript catches mismatches.',
        'FormArray<FormGroup<{ name: FormControl<string>, age: FormControl<number> }>> for arrays of groups.',
        'formArray.value gives the typed array value; formArray.getRawValue() includes disabled controls.',
        'Use fb.array<FormControl<string>>([]) for a typed empty array from FormBuilder.',
      ],
    },
    {
      heading: 'Common patterns',
      points: [
        'Add item: push a new FormGroup with default values; the template renders it automatically.',
        'Remove item: removeAt(index) — Angular removes the corresponding DOM nodes via @for.',
        'Reorder: swap values with patchValue() or use moveAt() (Angular 18+).',
        'Validate the array length with a custom validator on the FormArray itself.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Always use track on @for over formArray.controls — prevents full re-renders on add/remove.',
        'Do NOT push raw objects — always wrap in fb.group() or fb.control() for proper change tracking.',
        'FormArray.at(i) returns the control at index — use .get() for nested paths: array.at(0).get(\'name\').',
        'For very large or virtualised lists consider using a signal array + custom form sync instead.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'How do you add a control to a FormArray at runtime?', a: '<code>myArray.push(this.fb.group({ name: [\'\', Validators.required] }))</code>. Angular automatically renders the new item in the template if you iterate <code>myArray.controls</code>.' },
    { q: 'How do you remove an item from a FormArray?', a: '<code>myArray.removeAt(index)</code>. Angular updates the DOM automatically. If you are tracking by index in <code>@for</code>, the remaining items\' indices shift — be careful with animations triggered by index.' },
    { q: 'How do you access the value of a specific item in a FormArray?', a: '<code>myArray.at(index).value</code> for the whole group value. <code>myArray.at(index).get(\'name\')?.value</code> for a specific field. In the template, <code>[formGroupName]="i"</code> scopes the form to item <code>i</code>.' },
    { q: 'Can a FormArray contain nested FormArrays?', a: 'Yes — <code>fb.group({ tags: fb.array([fb.control(\'\')]) })</code>. Access the nested array with <code>form.get(\'tags\') as FormArray</code>. In the template use nested <code>formArrayName</code> directives.' },
    { q: 'How do you validate a FormArray as a whole?', a: 'Add a validator to the array itself: <code>fb.array([], [minLengthArray(1)])</code> where <code>minLengthArray</code> is a custom validator that checks <code>control.length</code>. Access errors with <code>myArray.errors</code>.' },
    { q: 'How do you pre-populate a FormArray from API data?', a: '<code>const controls = apiData.map(item => this.fb.group({ name: item.name })); this.form.setControl(\'items\', this.fb.array(controls));</code>. Or iterate and push inside a <code>data$.subscribe()</code> callback.' },
  ];

  arrayTabs: CodeTab[] = [
    {
      label: 'FormArray setup (TypeScript)',
      language: 'typescript',
      code: `
form = this.fb.group({
  name:   ['', Validators.required],
  // fb.array() — creates an array of controls
  emails: this.fb.array([this.createEmail()]),
  // Each item can be a FormControl OR a nested FormGroup
  skills: this.fb.array([this.createSkill()]),
});

// Getter — cast to FormArray so we get typed methods
get emails() { return this.form.get('emails') as FormArray; }

// Factory — creates one item to add to the array
createEmail() {
  return this.fb.control('', [Validators.required, Validators.email]);
}
createSkill() {
  return this.fb.group({
    name:  ['', Validators.required],
    level: ['beginner'],
  });
}

// Mutations — push() and removeAt() update the DOM automatically
addEmail()             { this.emails.push(this.createEmail()); }
removeEmail(i: number) { this.emails.removeAt(i); }`,
    },
    {
      label: 'FormArray template (HTML)',
      language: 'html',
      code: `
<!-- formArrayName binds the template to the FormArray -->
<div formArrayName="emails">
  @for (ctrl of emails.controls; track $index) {
    <div>
      <!-- [formControlName]="$index" — index IS the key -->
      <input [formControlName]="$index" type="email" />
      <button type="button" (click)="removeEmail($index)">✕</button>
    </div>
  }
</div>
<button type="button" (click)="addEmail()">+ Add email</button>

<!-- FormArray of FormGroups — needs formGroupName per item -->
<div formArrayName="skills">
  @for (g of skills.controls; track $index) {
    <div [formGroupName]="$index">
      <input formControlName="name" />
      <select formControlName="level">
        <option value="beginner">Beginner</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  }
</div>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which method do you call to add a new control to an existing FormArray at runtime?', options: ['formArray.add(control)', 'formArray.push(control)', 'formArray.append(control)', 'formArray.insert(control)'], answer: 1, explanation: 'FormArray.push(control) appends a new AbstractControl to the end of the array. Angular automatically renders the new item in the template when you iterate over formArray.controls.' },
    { q: 'In the template, when a FormArray contains plain FormControls (not FormGroups), which binding correctly connects each input to its array slot?', options: ['formControlName="ctrl"', '[formControlName]="ctrl.id"', '[formControlName]="$index"', 'formControlName="$index"'], answer: 2, explanation: 'When iterating a FormArray of FormControls, the array index IS the key. You must use the property-binding syntax [formControlName]="$index" so Angular evaluates $index as a number rather than treating it as a literal string.' },
    { q: 'In the FormArrayDemo component, what does the reset() method do after calling form.reset()?', options: ['It clears all arrays completely, leaving zero controls', 'It removes all items except the first from both the emails and skills arrays', 'It rebuilds the entire form from scratch using FormBuilder', 'It calls removeAt(0) to clear only the first item in each array'], answer: 1, explanation: 'After form.reset(), the reset() method runs while loops: while (this.emails.length > 1) this.emails.removeAt(1) and the same for skills. This trims both arrays back to exactly one item (index 0), matching the initial form state.' },
    { q: 'When should you use [formGroupName]="$index" instead of [formControlName]="$index" inside a formArrayName block?', options: ['Whenever the FormArray has more than one item', 'When each array item is itself a FormGroup containing nested controls', 'When you want two-way data binding instead of reactive binding', 'When the FormArray is nested inside another FormGroup'], answer: 1, explanation: 'formControlName targets a single scalar control. When each array slot holds a FormGroup (like the skills array with \'name\' and \'level\' fields), you must scope the template to that group first with [formGroupName]="$index", then use formControlName for the inner fields.' },
    { q: 'What is the correct way to validate a FormArray as a whole — for example, requiring at least one item?', options: ['Add Validators.required to every control inside the array', 'Check emails.length in the submit() handler and set a flag manually', 'Pass a custom validator to fb.array([], [myMinLengthValidator]) targeting the array itself', 'Use Validators.minLength(1) directly on the parent FormGroup'], answer: 2, explanation: 'FormArray accepts validators as its second argument, just like FormControl. A custom validator receives the FormArray as its AbstractControl argument and can inspect control.length, returning an error object or null. Access the errors via myArray.errors in the template.' },
  ];

  challenge: Challenge = {
    title: 'Build a Phone Numbers FormArray',
    description: 'Create a reactive form with a \'contactName\' field and a dynamic \'phones\' FormArray. Each phone entry should have a \'number\' field (required, min 7 chars) and a \'type\' field defaulting to \'mobile\'. Add buttons to add and remove phone entries. Prevent removing the last remaining phone. On submit, mark all as touched and display the form value if valid.',
    language: 'typescript',
    hints: [
      'Use fb.group({ number: [\'\', [Validators.required, Validators.minLength(7)]], type: [\'mobile\'] }) as your createPhone() factory.',
      'Add a getter: get phones(): FormArray { return this.form.get(\'phones\') as FormArray; } so the template can access phones.controls and phones.length.',
      'In the template use formArrayName="phones" on the wrapper div, then [formGroupName]="$index" on each row div inside the @for loop.',
      'Guard the remove button with @if (phones.length > 1) so the user cannot delete the only remaining phone entry.',
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-phone-form',
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <!-- TODO: bind [formGroup]="form" and (ngSubmit)="submit()" -->
    <form>

      <!-- TODO: add a text input bound to 'contactName' -->

      <!-- TODO: add formArrayName="phones" wrapper div -->
      <!-- TODO: iterate phones.controls with @for, bind [formGroupName]="$index" -->
        <!-- TODO: input for 'number' -->
        <!-- TODO: select for 'type' with options: mobile, home, work -->
        <!-- TODO: remove button, hidden when only 1 phone remains -->

      <button type="button" (click)="addPhone()">+ Add phone</button>
      <button type="submit">Submit</button>

      @if (submitted) {
        <pre>{{ form.value | json }}</pre>
      }
    </form>
  \`
})
export class PhoneFormComponent {
  private fb = inject(FormBuilder);

  // TODO: create form with 'contactName' (required) and 'phones' FormArray
  // form = ...

  // TODO: add getter for phones FormArray
  // get phones() ...

  // TODO: createPhone() factory method
  // createPhone() ...

  // TODO: addPhone() -- push a new phone group
  // addPhone() ...

  // TODO: removePhone(i: number) -- remove at index
  // removePhone(i: number) ...

  submitted = false;

  submit() {
    // TODO: markAllAsTouched, set submitted = true if valid
  }
}`,
    solution: `import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-phone-form',
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">

      <div>
        <label>Contact name</label>
        <input formControlName="contactName" placeholder="Full name" />
        @if (form.controls.contactName.touched && form.controls.contactName.invalid) {
          <span>Name is required.</span>
        }
      </div>

      <div formArrayName="phones">
        @for (group of phones.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="number" placeholder="Phone number" />
            <select formControlName="type" title="Phone type">
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>
            @if (phones.length > 1) {
              <button type="button" (click)="removePhone($index)">Remove</button>
            }
          </div>
        }
      </div>

      <button type="button" (click)="addPhone()">+ Add phone</button>
      <button type="submit">Submit</button>

      @if (submitted) {
        <pre>{{ form.value | json }}</pre>
      }
    </form>
  \`
})
export class PhoneFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    contactName: ['', Validators.required],
    phones: this.fb.array([this.createPhone()]),
  });

  get phones(): FormArray {
    return this.form.get('phones') as FormArray;
  }

  createPhone() {
    return this.fb.group({
      number: ['', [Validators.required, Validators.minLength(7)]],
      type: ['mobile'],
    });
  }

  addPhone() {
    this.phones.push(this.createPhone());
  }

  removePhone(i: number) {
    this.phones.removeAt(i);
  }

  submitted = false;

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted = true;
  }
}`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'FormArray', type: 'class', desc: 'Tracks the value and validity of an ordered list of AbstractControl instances — use it for dynamic lists of fields.' , since: '2'},
    { name: 'FormBuilder.array()', type: 'function', desc: 'Factory method on FormBuilder that creates a typed FormArray from an initial array of controls or values.' , since: '2'},
    { name: 'FormArray.push()', type: 'function', desc: 'Appends an AbstractControl to the end of a FormArray, causing Angular to render the new item in the template automatically.' , since: '2'},
    { name: 'FormArray.removeAt()', type: 'function', desc: 'Removes the control at the given index from the FormArray and updates the DOM.' , since: '2'},
    { name: 'FormArray.at()', type: 'function', desc: 'Returns the AbstractControl at the specified index — use .get(\'field\') on the result to access nested fields.' , since: '2'},
    { name: 'formArrayName', type: 'directive', desc: 'Binds a section of the template to a FormArray by name, required as a parent wrapper around @for loops over array controls.' , since: '2'},
    { name: 'FormArray.getRawValue()', type: 'function', desc: 'Returns the values of all controls including disabled ones, unlike .value which skips disabled controls.' , since: '2'},
    { name: 'FormArray.moveAt()', type: 'function', desc: 'Moves a control from one index to another within the FormArray for reordering items.' , since: '18'},
    { name: 'FormArray.setControl()', type: 'function', desc: 'Replaces an existing control at a given index with a new AbstractControl.' , since: '2'},
    { name: 'FormGroup.setControl()', type: 'function', desc: 'Replaces a named child control on a FormGroup — commonly used to swap out an entire FormArray populated from API data.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Iterating array controls: *ngFor vs @for', before: '<!-- Angular < 17: structural directive -->\n<div formArrayName=\'emails\'>\n  <div *ngFor=\'let ctrl of emails.controls; let i = index\'>\n    <input [formControlName]=\'i\' />\n    <button (click)=\'removeEmail(i)\'>Remove</button>\n  </div>\n</div>', after: '<!-- Angular 17+: built-in @for block -->\n<div formArrayName=\'emails\'>\n  @for (ctrl of emails.controls; track $index) {\n    <div>\n      <input [formControlName]=\'$index\' />\n      <button (click)=\'removeEmail($index)\'>Remove</button>\n    </div>\n  }\n</div>',
      note: '@for requires a track expression; tracking by $index is fine for FormArrays where controls are managed by push/removeAt.' },
    { title: 'Injecting FormBuilder: constructor vs inject()', before: '// Angular < 14: constructor injection\nexport class MyComponent {\n  constructor(private fb: FormBuilder) {}\n  form = this.fb.group({ items: this.fb.array([]) });\n}', after: '// Angular 14+: inject() function\nexport class MyComponent {\n  private fb = inject(FormBuilder);\n  form = this.fb.group({ items: this.fb.array([]) });\n}',
      note: 'inject() removes constructor boilerplate and works in both components and standalone functions.' },
    { title: 'Typed vs untyped FormArray', before: '// Pre-Angular 14: no generic, .value was \'any[]\'\nget emails(): FormArray {\n  return this.form.get(\'emails\') as FormArray;\n}', after: '// Angular 14+: typed FormArray\nget emails(): FormArray<FormControl<string>> {\n  return this.form.get(\'emails\') as FormArray<FormControl<string>>;\n}',
      note: 'Typed reactive forms (Angular 14+) let TypeScript catch mismatches when pushing the wrong control type.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Pushing raw objects instead of AbstractControl instances', wrong: '// WRONG — raw object, not a control\nthis.emails.push({ value: \'\', valid: false });', right: '// RIGHT — wrap in fb.control() or fb.group()\nthis.emails.push(this.fb.control(\'\', Validators.email));', explanation: 'FormArray expects AbstractControl instances. Pushing plain objects bypasses Angular\'s change detection and validation pipeline entirely.'  },
    { title: 'Using formControlName as a static string instead of a bound index', wrong: '<!-- WRONG — treats \'$index\' as a literal string key -->\n<input formControlName=\'$index\' />', right: '<!-- RIGHT — property binding evaluates $index as a number -->\n<input [formControlName]=\'$index\' />', explanation: 'When iterating a FormArray of plain FormControls the index IS the key. The static attribute form binds to a named string, not a number.'  },
    { title: 'Forgetting formArrayName wrapper in the template', wrong: '<!-- WRONG — no formArrayName, Angular cannot locate the array -->\n@for (ctrl of emails.controls; track $index) {\n  <input [formControlName]=\'$index\' />\n}', right: '<!-- RIGHT — formArrayName scopes the block to the array -->\n<div formArrayName=\'emails\'>\n  @for (ctrl of emails.controls; track $index) {\n    <input [formControlName]=\'$index\' />\n  }\n</div>', explanation: 'Without formArrayName, Angular has no context to resolve integer keys and throws a \'No value accessor\' or binding error at runtime.'  },
    { title: 'Resetting without trimming the array back to its initial size', wrong: '// WRONG — resets values but leaves extra controls in the array\nreset() { this.form.reset(); }', right: '// RIGHT — trim extra items after reset()\nreset() {\n  this.form.reset();\n  while (this.emails.length > 1) this.emails.removeAt(1);\n}', explanation: 'form.reset() resets control values and validity but does not change the number of controls in a FormArray, so previously added rows remain.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '14', label: 'Strictly Typed Reactive Forms', features: ['FormArray<T> generic parameter constrains which control types can be pushed', 'FormBuilder methods infer control types from initial values', 'UntypedFormArray available as an opt-out escape hatch'] },
    { version: '18', label: 'FormArray.moveAt()', features: ['New moveAt(from, to) method for reordering controls without manual swap logic', 'Removes need for patchValue() workarounds when changing item order'] },
  ];
}
