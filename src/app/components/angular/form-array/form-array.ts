import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
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
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-form-array',
  imports: [
    ReactiveFormsModule, JsonPipe, CodeBlockComponent, TheoryBlockComponent,
    QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './form-array.html',
  styleUrl: './form-array.scss',
})
export class FormArrayDemo {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Forms (Reactive & Template)', route: '/angular/forms-demo' },
    { label: 'Signals & Reactivity', route: '/angular/signals' },
  ];

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
        '<code>FormArray</code> holds an ordered list of <code>AbstractControl</code> instances — each element can be a <code>FormControl</code>, <code>FormGroup</code>, or even a nested <code>FormArray</code>.',
        '<code>fb.array([this.createItem()])</code> initialises the array with one item; <code>fb.array([])</code> starts empty.',
        '<code>formArray.push(ctrl)</code> appends a control; <code>formArray.removeAt(i)</code> removes by index; <code>formArray.insert(i, ctrl)</code> inserts at a position.',
        'The array\'s <code>value</code> is always a plain JavaScript array reflecting the current controls — Angular keeps it in sync automatically.',
        'Use a factory method (<code>createItem()</code>) to consistently produce controls with the correct shape and validators each time you add a row.',
      ],
    },
    {
      heading: 'Template wiring — formArrayName, @for, and formControlName',
      points: [
        'Wrap the repeating section in a <code>div formArrayName="fieldName"</code> to scope the template to the array.',
        'Iterate with <code>@for (ctrl of myArray.controls; track $index)</code> — <code>track</code> is required; <code>$index</code> is fine for add/remove use cases.',
        'When the array holds plain <code>FormControl</code>s, bind each input with <code>[formControlName]="$index"</code> (property binding, not static attribute).',
        'When the array holds <code>FormGroup</code>s, scope each row with <code>[formGroupName]="$index"</code>, then use <code>formControlName="field"</code> for inner inputs.',
        'Access error state on individual controls via <code>emails.at($index)</code> or the loop variable reference in the template.',
      ],
    },
    {
      heading: 'Typed FormArray (Angular 14+)',
      points: [
        '<code>FormArray&lt;FormControl&lt;string&gt;&gt;</code> constrains what can be pushed — TypeScript catches type mismatches at compile time.',
        '<code>FormArray&lt;FormGroup&lt;{ name: FormControl&lt;string&gt;, level: FormControl&lt;string&gt; }&gt;&gt;</code> for arrays of groups.',
        '<code>formArray.value</code> returns a typed array; <code>formArray.getRawValue()</code> includes disabled controls.',
        '<code>fb.array&lt;FormControl&lt;string&gt;&gt;([])</code> creates a typed empty array from FormBuilder.',
        '<code>UntypedFormArray</code> is available as an escape hatch for gradual migration from Angular 13 and earlier.',
      ],
    },
    {
      heading: 'Common patterns — add, remove, reorder',
      points: [
        'Add: <code>this.myArray.push(this.createItem())</code> — Angular renders the new row automatically via the <code>@for</code> loop.',
        'Remove: <code>this.myArray.removeAt(index)</code> — remaining controls\' indices shift, so always guard remove buttons with <code>myArray.length > 1</code> if at least one item is required.',
        'Reorder: <code>myArray.moveAt(from, to)</code> (Angular 18+) moves a control without manually swapping values.',
        'Pre-populate from API: <code>this.form.setControl(\'items\', this.fb.array(apiData.map(d => this.fb.group(d))))</code> — replaces the entire array atomically.',
        'Reset to initial state: call <code>form.reset()</code> then trim with <code>while (arr.length > 1) arr.removeAt(1)</code> — reset() alone does not change the number of controls.',
      ],
    },
    {
      heading: 'Validating the array itself',
      points: [
        'Pass validators as the second argument to <code>fb.array([], [myMinLengthValidator])</code> — the validator receives the <code>FormArray</code> as its <code>AbstractControl</code> argument.',
        'Inside the validator, inspect <code>control.length</code> (the number of controls) and return an error object or <code>null</code>.',
        'Access array-level errors in the template with <code>myArray.errors?.[\'minLength\']</code> — these live on the array, not individual controls.',
        'Control-level validators (e.g. <code>Validators.required</code>) are applied per item in the factory method, not on the array itself.',
        'Combine array-level and item-level validators: the array is <code>invalid</code> if either the array validator or any item validator fails.',
      ],
    },
    {
      heading: 'Best practices',
      points: [
        'Always use <code>track $index</code> (or a unique id) on <code>@for</code> over array controls — prevents full DOM re-renders on every add/remove.',
        'Do NOT push raw objects into a FormArray — always wrap with <code>fb.control()</code> or <code>fb.group()</code> for proper change detection and validation.',
        'For very large or virtualised lists, consider a signal array + manual form sync instead of a single giant FormArray.',
        '<code>FormArray.at(i)</code> returns the typed control at index; prefer it over <code>controls[i]</code> for clarity and type inference.',
        'Extract item construction into a factory method — this keeps push/reset/prepopulate logic consistent and makes the factory easily unit-testable.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'How do you add a control to a FormArray at runtime?', a: '<code>myArray.push(this.fb.group({ name: [\'\', Validators.required] }))</code>. Angular automatically renders the new item in the template if you iterate <code>myArray.controls</code>.' },
    { q: 'How do you remove an item from a FormArray?', a: '<code>myArray.removeAt(index)</code>. Angular updates the DOM automatically. If you are tracking by index in <code>@for</code>, the remaining items\' indices shift — be careful with animations triggered by index.' },
    { q: 'How do you access the value of a specific item in a FormArray?', a: '<code>myArray.at(index).value</code> for the whole group value. <code>myArray.at(index).get(\'name\')?.value</code> for a specific field. In the template, <code>[formGroupName]="i"</code> scopes the form to item <code>i</code>.' },
    { q: 'Can a FormArray contain nested FormArrays?', a: 'Yes — <code>fb.group({ tags: fb.array([fb.control(\'\')]) })</code>. Access the nested array with <code>form.get(\'tags\') as FormArray</code>. In the template use nested <code>formArrayName</code> directives.' },
    { q: 'How do you validate a FormArray as a whole?', a: 'Add a validator to the array itself: <code>fb.array([], [minLengthArray(1)])</code> where <code>minLengthArray</code> is a custom validator that checks <code>control.length</code>. Access errors with <code>myArray.errors</code>.' },
    { q: 'How do you pre-populate a FormArray from API data?', a: '<code>this.form.setControl(\'items\', this.fb.array(apiData.map(item => this.fb.group({ name: item.name }))))</code>. This replaces the entire FormArray atomically with controls created from the API response.' },
    { q: 'What is the difference between FormArray.value and FormArray.getRawValue()?', a: '<code>value</code> returns an array of values, but omits any disabled controls in the array. <code>getRawValue()</code> returns all controls\' values regardless of disabled state — use it when you need to read or submit the full data set.' },
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
    { q: 'You call formArray.push(newControl) to add an item, but the template — which iterates the array using a plain @for over a cached local variable assigned once in ngOnInit — does not show the new item. What is the actual cause?', options: ['FormArray.push() is broken and does not actually add the control', 'The template is iterating a stale local copy of the controls array captured once, rather than reading formArray.controls fresh on each change-detection cycle, so it never sees the newly pushed item', 'push() requires calling markForCheck() manually to notify the template', '@for cannot iterate FormArray controls at all'], answer: 1, explanation: 'push() correctly mutates the FormArray and Angular\'s change detection re-runs the template — the bug is almost always on the consuming side: if a component captured `const items = this.formArray.controls;` once (e.g. in ngOnInit) and the template iterates that captured local variable instead of `formArray.controls` directly, the local variable still points at the OLD array reference from before the push, since push() mutates in place but a separately-held reference doesn\'t automatically "see" array mutations unless the template re-reads the live `formArray.controls` property on every check. The fix is always binding @for directly to `formArray.controls` in the template, not to a cached snapshot.' },
    { q: 'In the template, when a FormArray contains plain FormControls (not FormGroups), which binding correctly connects each input to its array slot?', options: ['formControlName="ctrl"', '[formControlName]="ctrl.id"', '[formControlName]="$index"', 'formControlName="$index"'], answer: 2, explanation: 'When iterating a FormArray of FormControls, the array index IS the key. You must use the property-binding syntax [formControlName]="$index" so Angular evaluates $index as a number rather than treating it as a literal string.' },
    { q: 'In the FormArrayDemo component, what does the reset() method do after calling form.reset()?', options: ['It clears all arrays completely, leaving zero controls', 'It removes all items except the first from both the emails and skills arrays', 'It rebuilds the entire form from scratch using FormBuilder', 'It calls removeAt(0) to clear only the first item in each array'], answer: 1, explanation: 'After form.reset(), the reset() method runs while loops: while (this.emails.length > 1) this.emails.removeAt(1) and the same for skills. This trims both arrays back to exactly one item (index 0), matching the initial form state.' },
    { q: 'When should you use [formGroupName]="$index" instead of [formControlName]="$index" inside a formArrayName block?', options: ['Whenever the FormArray has more than one item', 'When each array item is itself a FormGroup containing nested controls', 'When you want two-way data binding instead of reactive binding', 'When the FormArray is nested inside another FormGroup'], answer: 1, explanation: 'formControlName targets a single scalar control. When each array slot holds a FormGroup (like the skills array with \'name\' and \'level\' fields), you must scope the template to that group first with [formGroupName]="$index", then use formControlName for the inner fields.' },
    { q: 'What is the correct way to validate a FormArray as a whole — for example, requiring at least one item?', options: ['Add Validators.required to every control inside the array', 'Check emails.length in the submit() handler and set a flag manually', 'Pass a custom validator to fb.array([], [myMinLengthValidator]) targeting the array itself', 'Use Validators.minLength(1) directly on the parent FormGroup'], answer: 2, explanation: 'FormArray accepts validators as its second argument, just like FormControl. A custom validator receives the FormArray as its AbstractControl argument and can inspect control.length, returning an error object or null. Access the errors via myArray.errors in the template.' },
    { q: 'How do you replace an entire FormArray\'s contents from API data?', options: ['Call push() in a loop for each API item', 'Call form.patchValue() with the raw array', 'Call form.setControl(\'items\', fb.array(apiData.map(...)))', 'Reset the form first, then push each item'], answer: 2, explanation: 'form.setControl() replaces a named child control atomically. Passing a new fb.array() with controls built from API data is the cleanest approach — it updates validity, values, and the template in one step.' },
    { q: 'What does FormArray.at(i) return?', options: ['The raw value at index i', 'The AbstractControl at index i', 'A typed snapshot of the item', 'The DOM element at row i'], answer: 1, explanation: 'FormArray.at(i) returns the AbstractControl (FormControl, FormGroup, or FormArray) at that index. Use .value to read the value, or .get(\'field\') to access a nested control within a group.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormArray', type: 'class', desc: 'Tracks the value and validity of an ordered list of AbstractControl instances — use it for dynamic lists of fields.', since: '2' },
    { name: 'FormBuilder.array()', type: 'method', desc: 'Factory method on FormBuilder that creates a typed FormArray from an initial array of controls or values.', since: '2' },
    { name: 'FormArray.push()', type: 'method', desc: 'Appends an AbstractControl to the end of a FormArray, causing Angular to render the new item in the template automatically.', since: '2' },
    { name: 'FormArray.removeAt()', type: 'method', desc: 'Removes the control at the given index from the FormArray and updates the DOM.', since: '2' },
    { name: 'FormArray.at()', type: 'method', desc: 'Returns the AbstractControl at the specified index — use .get(\'field\') on the result to access nested fields.', since: '2' },
    { name: 'formArrayName', type: 'directive', desc: 'Binds a section of the template to a FormArray by name, required as a parent wrapper around @for loops over array controls.', since: '2' },
    { name: 'FormArray.getRawValue()', type: 'method', desc: 'Returns the values of all controls including disabled ones, unlike .value which skips disabled controls.', since: '2' },
    { name: 'FormArray.moveAt()', type: 'method', desc: 'Moves a control from one index to another within the FormArray for reordering items.', since: '18' },
    { name: 'FormArray.setControl()', type: 'method', desc: 'Replaces an existing control at a given index with a new AbstractControl.', since: '2' },
    { name: 'FormGroup.setControl()', type: 'method', desc: 'Replaces a named child control on a FormGroup — commonly used to swap out an entire FormArray populated from API data.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Iterating array controls: *ngFor vs @for',
      before: '<!-- Angular < 17: structural directive -->\n<div formArrayName=\'emails\'>\n  <div *ngFor=\'let ctrl of emails.controls; let i = index\'>\n    <input [formControlName]=\'i\' />\n    <button (click)=\'removeEmail(i)\'>Remove</button>\n  </div>\n</div>',
      after: '<!-- Angular 17+: built-in @for block -->\n<div formArrayName=\'emails\'>\n  @for (ctrl of emails.controls; track $index) {\n    <div>\n      <input [formControlName]=\'$index\' />\n      <button (click)=\'removeEmail($index)\'>Remove</button>\n    </div>\n  }\n</div>',
      note: '@for requires a track expression; tracking by $index is fine for FormArrays where controls are managed by push/removeAt.',
    },
    {
      title: 'Injecting FormBuilder: constructor vs inject()',
      before: '// Angular < 14: constructor injection\nexport class MyComponent {\n  constructor(private fb: FormBuilder) {}\n  form = this.fb.group({ items: this.fb.array([]) });\n}',
      after: '// Angular 14+: inject() function\nexport class MyComponent {\n  private fb = inject(FormBuilder);\n  form = this.fb.group({ items: this.fb.array([]) });\n}',
      note: 'inject() removes constructor boilerplate and works in both components and standalone functions.',
    },
    {
      title: 'Typed vs untyped FormArray',
      before: '// Pre-Angular 14: no generic, .value was \'any[]\'\nget emails(): FormArray {\n  return this.form.get(\'emails\') as FormArray;\n}',
      after: '// Angular 14+: typed FormArray\nget emails(): FormArray<FormControl<string>> {\n  return this.form.get(\'emails\') as FormArray<FormControl<string>>;\n}',
      note: 'Typed reactive forms (Angular 14+) let TypeScript catch mismatches when pushing the wrong control type.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Pushing raw objects instead of AbstractControl instances',
      wrong: '// WRONG — raw object, not a control\nthis.emails.push({ value: \'\', valid: false });',
      right: '// RIGHT — wrap in fb.control() or fb.group()\nthis.emails.push(this.fb.control(\'\', Validators.email));',
      explanation: 'FormArray expects AbstractControl instances. Pushing plain objects bypasses Angular\'s change detection and validation pipeline entirely.',
    },
    {
      title: 'Using formControlName as a static string instead of a bound index',
      wrong: '<!-- WRONG — treats \'$index\' as a literal string key -->\n<input formControlName=\'$index\' />',
      right: '<!-- RIGHT — property binding evaluates $index as a number -->\n<input [formControlName]=\'$index\' />',
      explanation: 'When iterating a FormArray of plain FormControls the index IS the key. The static attribute form binds to a named string, not a number.',
    },
    {
      title: 'Forgetting formArrayName wrapper in the template',
      wrong: '<!-- WRONG — no formArrayName, Angular cannot locate the array -->\n@for (ctrl of emails.controls; track $index) {\n  <input [formControlName]=\'$index\' />\n}',
      right: '<!-- RIGHT — formArrayName scopes the block to the array -->\n<div formArrayName=\'emails\'>\n  @for (ctrl of emails.controls; track $index) {\n    <input [formControlName]=\'$index\' />\n  }\n</div>',
      explanation: 'Without formArrayName, Angular has no context to resolve integer keys and throws a \'No value accessor\' or binding error at runtime.',
    },
    {
      title: 'Resetting without trimming the array back to its initial size',
      wrong: '// WRONG — resets values but leaves extra controls in the array\nreset() { this.form.reset(); }',
      right: '// RIGHT — trim extra items after reset()\nreset() {\n  this.form.reset();\n  while (this.emails.length > 1) this.emails.removeAt(1);\n}',
      explanation: 'form.reset() resets control values and validity but does not change the number of controls in a FormArray, so previously added rows remain.',
    },
    {
      title: 'Tracking by $index when reordering causes wrong DOM updates',
      wrong: '// Reordering with moveAt() while tracking by $index\n// Angular re-uses wrong DOM nodes — inputs show stale values\n@for (ctrl of items.controls; track $index) { ... }',
      right: '// Track by a unique id on the control\'s value instead\n@for (ctrl of items.controls; track ctrl.value.id) { ... }',
      explanation: 'When you reorder via moveAt(), $index changes for every item. Angular sees these as different nodes and destroys/recreates them incorrectly. Tracking by a stable unique property (e.g. item id) tells Angular which DOM node belongs to which control after the reorder.',
    },
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

  revision: RevisionSummary = {
    oneLiner: 'FormArray holds an ordered list of reactive controls you can add, remove, and reorder at runtime — the go-to solution for dynamic form rows like email lists, addresses, or skills.',
    mustKnow: [
      'fb.array([this.createItem()]) initialises with one item; push()/removeAt() mutate the array and Angular updates the DOM automatically.',
      'In the template: formArrayName on the wrapper div, [formControlName]="$index" for control arrays, [formGroupName]="$index" for group arrays.',
      'Always use a factory method (createItem()) for consistent control shape with the right validators on each add/reset.',
      'form.reset() does NOT change the number of controls — trim manually with while (arr.length > 1) arr.removeAt(1).',
      'Validate the array as a whole by passing a validator to fb.array([], [myValidator]) — errors live on myArray.errors.',
      'Use getRawValue() instead of value when the array may contain disabled controls to avoid missing data.',
    ],
    interviewFocus: [
      'When to use FormArray vs multiple separate FormControls — use FormArray when the number of fields is dynamic at runtime.',
      'formControlName vs formGroupName inside formArrayName — depends on whether each array slot is a scalar or an object.',
      'How to pre-populate a FormArray from an API response — setControl() + fb.array(data.map(d => fb.group(d))).',
      'Why reset() alone is insufficient and what the correct reset pattern is (trim + reset).',
    ],
  };
}
