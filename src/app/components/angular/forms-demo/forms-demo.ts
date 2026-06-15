import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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

interface SubmittedData {
  source: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-forms-demo',
  imports: [
    ReactiveFormsModule, FormsModule, CodeBlockComponent, TheoryBlockComponent,
    QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './forms-demo.html',
  styleUrl: './forms-demo.scss',
})
export class FormsDemo {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Template Syntax', route: '/angular/template-syntax' },
    { label: 'Signals & Reactivity', route: '/angular/signals' },
  ];

  reactiveForm = this.fb.group({
    name:  ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  templateModel = { name: '', email: '' };
  submitted = signal<SubmittedData | null>(null);

  submitReactive() {
    if (this.reactiveForm.invalid) return;
    const { name, email } = this.reactiveForm.value;
    this.submitted.set({ source: 'Reactive Form', name: name!, email: email! });
  }

  submitTemplate() {
    this.submitted.set({
      source: 'Template-Driven Form',
      name: this.templateModel.name,
      email: this.templateModel.email,
    });
  }

  reset() {
    this.reactiveForm.reset();
    this.templateModel = { name: '', email: '' };
    this.submitted.set(null);
  }

  get rf() { return this.reactiveForm.controls; }

  passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm:  ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
  }, { validators: [this.passwordMatch] });

  passwordSubmitted = signal<{ username: string } | null>(null);

  get pf() { return this.passwordForm.controls; }

  passwordMatch(group: AbstractControl): ValidationErrors | null {
    const pwd     = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pwd === confirm ? null : { mismatch: true };
  }

  submitPassword() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.passwordSubmitted.set({ username: this.passwordForm.value.username! });
  }

  resetPasswordForm() {
    this.passwordForm.reset();
    this.passwordSubmitted.set(null);
  }

  crossFieldCodeTabs: CodeTab[] = [
    {
      label: 'Cross-field validator',
      language: 'typescript',
      code: `import { AbstractControl, ValidationErrors } from '@angular/forms';

// Validator receives the FormGroup — can compare any two fields
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pwd     = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pwd === confirm ? null : { mismatch: true };
}

// Apply to the FormGroup, not a control:
form = this.fb.group({
  password: ['', [Validators.required, Validators.minLength(6)]],
  confirm:  ['', Validators.required],
  username: ['', Validators.required],
}, { validators: [passwordMatch] });  // ← group-level validator

// In template — check form.errors (not a control):
// @if (form.errors?.['mismatch'] && pf['confirm'].touched) {
//   <span class="err">Passwords do not match.</span>
// }

// Force all errors visible on submit:
submitForm() {
  this.form.markAllAsTouched();
  if (this.form.invalid) return;
  // proceed...
}`,
    },
    {
      label: 'Form status signals',
      language: 'html',
      code: `<!-- form.valid, form.errors, control.touched are reactive -->
<form [formGroup]="form" (ngSubmit)="submit()">

  <input formControlName="password" type="password" />
  @if (pf['password'].touched && pf['password'].errors?.['minlength']) {
    <span class="err">Min 6 characters.</span>
  }

  <input formControlName="confirm" type="password" />
  <!-- Group-level error — check form.errors, not control.errors -->
  @if (form.errors?.['mismatch'] && pf['confirm'].touched) {
    <span class="err">Passwords do not match.</span>
  }

  <!-- Status badges -->
  <span [class.valid]="form.valid">
    {{ form.valid ? 'Valid ✓' : 'Invalid ✗' }}
  </span>

  <button type="submit" [disabled]="form.invalid">Register</button>
</form>`,
    },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Template-driven forms',
      points: [
        'Template-driven forms use <code>FormsModule</code> + <code>[(ngModel)]</code> — Angular creates <code>FormControl</code> instances implicitly behind the scenes.',
        'Validation is declared on the element: <code>required</code>, <code>minlength</code>, <code>pattern</code>, <code>email</code> — Angular reads these attributes and attaches built-in validators.',
        'Access control state via template reference variables: <code>#email="ngModel"</code> then <code>email.invalid</code>, <code>email.touched</code>, <code>email.errors</code>.',
        'The entire form is accessed via <code>#f="ngForm"</code> — <code>f.valid</code> aggregates the validity of all child controls.',
        'Best for simple forms (login, search, contact) — less boilerplate but harder to unit-test and type-check than reactive forms.',
      ],
    },
    {
      heading: 'Reactive forms fundamentals',
      points: [
        'Reactive forms use <code>ReactiveFormsModule</code> + <code>FormBuilder</code> to define an explicit model in the component class — the template is just a view of the model.',
        'Bind the model to the template with <code>[formGroup]="form"</code> on the form element and <code>formControlName="field"</code> on each input.',
        'Add validators as an array in the class: <code>fb.control(\'\', [Validators.required, Validators.email])</code>.',
        'Access controls via <code>form.get(\'name\')</code> or the shorthand getter <code>get rf() { return this.form.controls; }</code>.',
        'Best for complex, dynamic, and testable forms — the model lives in the class so it can be unit-tested without a DOM.',
      ],
    },
    {
      heading: 'FormGroup, FormControl, and FormArray',
      points: [
        '<code>FormControl</code> tracks the value, validity, dirty/pristine, and touched/untouched state of a single input element.',
        '<code>FormGroup</code> holds a dictionary of controls and tracks their combined validity — it\'s invalid if any child is invalid.',
        '<code>FormArray</code> holds an ordered list of controls — ideal for dynamic fields like a list of phone numbers or addresses.',
        'All three extend <code>AbstractControl</code>, which provides <code>value</code>, <code>status</code>, <code>errors</code>, <code>valueChanges</code>, and control mutation methods.',
        'Nest <code>FormGroup</code> inside <code>FormGroup</code> to model nested objects; bind with <code>formGroupName="address"</code> in the template.',
      ],
    },
    {
      heading: 'Validation — built-in, custom, and async',
      points: [
        'Built-in: <code>Validators.required</code>, <code>minLength(n)</code>, <code>maxLength(n)</code>, <code>pattern(regex)</code>, <code>email</code> — combine as an array.',
        'Custom sync validators are plain functions: <code>(control: AbstractControl): ValidationErrors | null</code> — return an error object or null.',
        'Cross-field validators are applied to a <code>FormGroup</code>, not a single control — access sibling fields via <code>group.get(\'fieldName\')</code>.',
        'Async validators return <code>Observable&lt;ValidationErrors | null&gt;</code> — Angular shows <code>PENDING</code> status while they run and debounces automatically.',
        'Always call <code>form.markAllAsTouched()</code> on submit to reveal all validation error messages at once, even for fields the user skipped.',
      ],
    },
    {
      heading: 'Typed Forms (Angular 14+)',
      points: [
        'From Angular 14, <code>FormControl&lt;string&gt;</code>, <code>FormGroup&lt;{name: FormControl&lt;string&gt;}&gt;</code> carry generic type parameters.',
        '<code>FormBuilder.group()</code> infers control types from the initial values automatically — no manual generics needed in most cases.',
        '<code>form.value</code> omits disabled controls and returns a partial typed object; <code>form.getRawValue()</code> includes all controls and returns a complete typed object.',
        '<code>UntypedFormControl</code> / <code>UntypedFormGroup</code> are provided for incremental migration from Angular 13 and earlier.',
        'Type safety catches field-name typos and shape mismatches at compile time — <code>form.controls.emal</code> becomes a TS error instead of a runtime undefined.',
      ],
    },
    {
      heading: 'Best practices and reactive patterns',
      points: [
        'Use <code>form.valueChanges.pipe(debounceTime(300), takeUntilDestroyed())</code> for live auto-save or search — never subscribe without teardown.',
        'Convert <code>valueChanges</code> to a signal with <code>toSignal(form.valueChanges, { initialValue: form.value })</code> to use the form value in <code>computed()</code>.',
        'Do not use <code>ngModel</code> inside a reactive form — the two APIs conflict and cause console errors.',
        'Use <code>form.patchValue({ key: val })</code> for partial updates; <code>form.setValue()</code> requires every key and throws if one is missing.',
        'Prefer reactive forms for any form with more than two fields, dynamic validation rules, or submission logic — they scale and test much better than template-driven forms.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use template-driven vs reactive forms?', a: 'Use <strong>template-driven</strong> for simple forms with minimal logic (login, search). Use <strong>reactive</strong> for complex forms, dynamic fields, custom validators, or when you need to unit-test form logic independently of the DOM.' },
    { q: 'How do you set an initial value in a reactive form?', a: '<code>fb.control(\'initialValue\')</code> or <code>form.patchValue({ fieldName: \'value\' })</code> after creation. Use <code>setValue</code> to set ALL fields at once (throws if a key is missing); use <code>patchValue</code> for partial updates.' },
    { q: 'What does form.markAllAsTouched() do?', a: 'It marks every control as touched — triggering all validation error messages to display. Call it on form submit to show all errors at once instead of waiting for each field to be touched individually.' },
    { q: 'How do you disable a form field?', a: '<code>control.disable()</code> in code, or <code>fb.control({ value: \'\', disabled: true })</code> at creation. Note: <code>form.value</code> omits disabled fields — use <code>form.getRawValue()</code> to include them.' },
    { q: 'What is the difference between valid, invalid, pending, and disabled status?', a: '<code>valid</code> — all validators pass. <code>invalid</code> — at least one fails. <code>pending</code> — async validator in flight. <code>disabled</code> — control is disabled (not validated). Check with <code>control.status</code>.' },
    { q: 'How do you listen for value changes reactively?', a: '<code>form.get(\'email\')!.valueChanges.pipe(debounceTime(300)).subscribe(val => ...)</code>. Or convert to signal: <code>toSignal(form.valueChanges, { initialValue: form.value })</code>. Always pair with <code>takeUntilDestroyed()</code> to prevent memory leaks.' },
    { q: 'What do Typed Forms (Angular 14+) buy you over untyped?', a: 'Type safety on <code>form.controls.fieldName</code> catches typos at compile time. <code>form.getRawValue()</code> returns a fully typed object instead of <code>any</code>. <code>FormBuilder.group()</code> infers control types from initial values, so most code just works without explicit generics.' },
  ];

  formsTabs: CodeTab[] = [
    {
      label: 'Reactive Form',
      language: 'typescript',
      code: `
// Needs: ReactiveFormsModule in imports[]

// Class — form defined in TypeScript (type-safe, testable)
form = this.fb.group({
  name:  ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
});

get rf() { return this.form.controls; }

// Template
// <form [formGroup]="form" (ngSubmit)="submit()">
//   <input formControlName="name" />
//   @if (rf['name'].touched && rf['name'].errors?.['required']) {
//     <span>Name required</span>
//   }
//   <button [disabled]="form.invalid">Submit</button>
// </form>`,
    },
    {
      label: 'Template-Driven Form',
      language: 'html',
      code: `
<!-- Needs: FormsModule in imports[] -->
<!-- Form state lives in the template via ngModel / ngForm -->

<form #f="ngForm" (ngSubmit)="submit()">
  <input
    name="email"
    type="email"
    [(ngModel)]="model.email"
    required
    email
    #emailField="ngModel"
  />

  <!-- Errors read from the local template ref variable -->
  @if (emailField.touched && emailField.errors?.['required']) {
    <span>Email required.</span>
  }
  @if (emailField.touched && emailField.errors?.['email']) {
    <span>Invalid email format.</span>
  }

  <button [disabled]="f.invalid">Submit</button>
</form>`,
    },
    {
      label: 'Cross-field validation',
      language: 'typescript',
      code: `// Cross-field validator: validate that two fields match (password confirm)
import { AbstractControl, ValidationErrors } from '@angular/forms';

// Validator applied to the FormGroup, not a single control
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pwd    = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pwd === confirm ? null : { mismatch: true };
}

// Usage:
form = this.fb.group({
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirm:  ['', Validators.required],
}, { validators: [passwordMatch] });

// In template:
// @if (form.errors?.['mismatch'] && form.get('confirm')?.touched) {
//   <p class="error">Passwords do not match</p>
// }

// Tip: always call form.markAllAsTouched() on submit
// to show ALL errors at once, not just the first touched field.
submitForm() {
  this.form.markAllAsTouched();
  if (this.form.invalid) return;
  // ...
}`,
    },
    {
      label: 'valueChanges + signal sync',
      language: 'typescript',
      code: `// Pattern: sync form value into a signal for reactive template use
export class SearchFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({ query: [''], category: ['all'] });

  // Live-update a signal whenever the form changes
  private destroyRef = inject(DestroyRef);
  searchParams = signal({ query: '', category: 'all' });

  constructor() {
    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(isEqual),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => this.searchParams.set({ ...val } as any));
  }

  // Now use searchParams() in computed() or effect() for reactive derived state
  results = toSignal(
    toObservable(this.searchParams).pipe(
      switchMap(p => this.http.get('/api/search', { params: p })),
      catchError(() => of([]))
    ), { initialValue: [] }
  );
}`,
    },
    {
      label: 'Comparison',
      language: 'typescript',
      code: `
// ── REACTIVE ──────────────────────────────────────────────
// ✅ Type-safe FormGroup — catch typos at compile time
// ✅ Unit-testable without DOM (just test the TS object)
// ✅ Dynamic fields via FormArray (see the FormArray page)
// ✅ Fine-grained valueChanges$ Observable for live reactions
// ⚠️  More boilerplate to set up initially

// ── TEMPLATE-DRIVEN ───────────────────────────────────────
// ✅ Less setup — form lives in HTML
// ✅ Familiar if you come from AngularJS / Vue v-model
// ⚠️  Validation is HTML attributes — harder to test
// ⚠️  No compile-time type checking on field names
// ⚠️  Complex/dynamic forms get messy quickly

// Rule of thumb:
// Simple login / search forms → Template-Driven
// Multi-step, dynamic, or data-heavy forms → Reactive`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of Reactive Forms over Template-Driven Forms?',
      options: ['Less boilerplate', 'Two-way binding with ngModel', 'Explicit, type-safe control structure', 'No imports needed'],
      answer: 2,
      explanation: 'Reactive Forms are defined in the component class — they are explicit, testable, and fully type-safe.',
    },
    {
      q: 'Which class creates a group of FormControls?',
      options: ['FormArray', 'FormGroup', 'FormBuilder', 'ControlGroup'],
      answer: 1,
      explanation: 'FormGroup holds a collection of FormControls and tracks their combined validity.',
    },
    {
      q: 'What does Validators.required return when the control is empty?',
      options: ['false', 'null', '{ required: true }', 'undefined'],
      answer: 2,
      explanation: 'Validators return an error object (truthy) when invalid, or null when valid.',
    },
    {
      q: 'How do you access the value of a reactive FormControl named "email"?',
      options: ['form.email', 'form.get("email").value', 'form.controls.email.value', 'Both B and C'],
      answer: 3,
      explanation: 'Both form.get("email")?.value and form.controls["email"].value access the same underlying value.',
    },
    {
      q: 'What does form.getRawValue() return that form.value does not?',
      options: ['The form as JSON', 'Values of disabled controls', 'Validation error objects', 'A typed FormGroup'],
      answer: 1,
      explanation: 'form.value omits disabled controls. form.getRawValue() includes all controls regardless of disabled state — use it when you need to submit all field values.',
    },
    {
      q: 'Where should a cross-field validator (e.g. password match) be applied?',
      options: ['On each individual FormControl', 'On the FormGroup as a second argument', 'In the template via directive', 'As an async validator'],
      answer: 1,
      explanation: 'Group-level validators are passed as the second argument to fb.group(). They receive the entire FormGroup and can compare any controls within it. Errors attach to form.errors, not control.errors.',
    },
    {
      q: 'What does form.valueChanges return?',
      options: ['The current form value snapshot', 'An Observable that emits each time any control value changes', 'A Promise resolving to the form value', 'A signal of the form value'],
      answer: 1,
      explanation: 'valueChanges is an Observable that emits the latest form value whenever any control changes. Pipe it through debounceTime() for live search or auto-save, and always pair with takeUntilDestroyed() to avoid memory leaks.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormBuilder', type: 'class', desc: 'Injectable service that provides shorthand methods (group, control, array) to create reactive form instances.', since: '2' },
    { name: 'FormGroup', type: 'class', desc: 'Tracks the value and validity state of a group of FormControl instances as one object.', since: '2' },
    { name: 'FormControl', type: 'class', desc: 'Tracks the value, validation status, and UI state (touched/dirty) of a single form input.', since: '2' },
    { name: 'Validators', type: 'class', desc: 'Built-in validator functions (required, email, minLength, maxLength, pattern) used in reactive and template-driven forms.', since: '2' },
    { name: 'AbstractControl', type: 'class', desc: 'Base class for FormControl, FormGroup, and FormArray — used as the parameter type in custom validator functions.', since: '2' },
    { name: 'ReactiveFormsModule', type: 'class', desc: 'Module that provides directives such as formGroup, formControlName, and formArrayName for binding reactive form models to the template.', since: '2' },
    { name: 'FormsModule', type: 'class', desc: 'Module that enables template-driven forms via ngModel and ngForm directives.', since: '2' },
    { name: 'formControlName', type: 'directive', desc: 'Binds a named FormControl inside a parent formGroup directive to an input element.', since: '2' },
    { name: 'ngModel', type: 'directive', desc: 'Two-way binding directive used in template-driven forms to sync an input with a component property.', since: '2' },
    { name: 'ValidationErrors', type: 'interface', desc: 'Type alias (Record<string, any>) returned by a validator function when validation fails, or null when it passes.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Typed Forms (Angular 14+): untyped vs typed FormGroup',
      before: '// Angular 13 and earlier — no generic type, values are \'any\'\nform = new FormGroup({\n  name: new FormControl(\'\'),\n  email: new FormControl(\'\'),\n});\nconst name: any = form.get(\'name\').value;',
      after: '// Angular 14+ — FormControl<string> gives compile-time safety\nform = this.fb.group({\n  name:  [\'\', Validators.required],\n  email: [\'\', [Validators.required, Validators.email]],\n});\nconst name: string | null = this.form.controls.name.value;',
      note: 'FormBuilder.group() infers types from initial values in Angular 14+.',
    },
    {
      title: 'Injecting FormBuilder: constructor vs inject()',
      before: '// Old pattern — constructor injection\nconstructor(private fb: FormBuilder) {}\nform = this.fb.group({ name: [\'\'] });',
      after: '// Modern pattern — inject() function (Angular 14+)\nprivate fb = inject(FormBuilder);\nform = this.fb.group({ name: [\'\'] });',
      note: 'inject() works at field-initializer level, removing the need for a constructor.',
    },
    {
      title: 'Template conditional error display: *ngIf vs @if',
      before: '<!-- Angular 16 and earlier -->\n<span *ngIf="rf[\'name\'].touched && rf[\'name\'].errors?.[\'required\']">\n  Name is required.\n</span>',
      after: '<!-- Angular 17+ built-in control flow -->\n@if (rf[\'name\'].touched && rf[\'name\'].errors?.[\'required\']) {\n  <span>Name is required.</span>\n}',
      note: '@if is the recommended syntax from Angular 17 onwards; *ngIf still works but is legacy.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mixing ngModel inside a reactive form',
      wrong: '// ReactiveFormsModule imported — then using ngModel too\n<input formControlName=\'email\' [(ngModel)]=\'model.email\' />',
      right: '// Use EITHER formControlName (reactive) OR ngModel (template-driven)\n<input formControlName=\'email\' />',
      explanation: 'ngModel and formControlName conflict inside the same form. Pick one approach per form; using both causes unexpected binding and console errors.',
    },
    {
      title: 'Checking form.errors for a group-level validator on the wrong node',
      wrong: '// Cross-field \'mismatch\' error is on the FormGroup, not the control\n@if (pf[\'confirm\'].errors?.[\'mismatch\']) { <span>No match</span> }',
      right: '// Read group-level errors from the FormGroup itself\n@if (form.errors?.[\'mismatch\'] && pf[\'confirm\'].touched) {\n  <span>Passwords do not match.</span>\n}',
      explanation: 'Group validators attach errors to the FormGroup, not individual controls. Always read them via form.errors, not control.errors.',
    },
    {
      title: 'Using form.value instead of form.getRawValue() when fields are disabled',
      wrong: '// \'username\' is disabled — it is MISSING from form.value\nconst payload = this.form.value;\nconsole.log(payload.username); // undefined',
      right: '// getRawValue() includes disabled controls\nconst payload = this.form.getRawValue();\nconsole.log(payload.username); // \'jdoe\'',
      explanation: 'Angular omits disabled controls from form.value to prevent accidental submission. Use getRawValue() when you need all field values regardless of disabled state.',
    },
    {
      title: 'Forgetting markAllAsTouched() on submit — errors stay hidden',
      wrong: 'submit() {\n  if (this.form.invalid) return; // errors never shown if user clicked Submit directly\n}',
      right: 'submit() {\n  this.form.markAllAsTouched(); // reveals all validation errors at once\n  if (this.form.invalid) return;\n}',
      explanation: 'Validation error messages are conditionally shown only when a field is \'touched\'. Without markAllAsTouched(), users who click Submit without touching every field see no feedback.',
    },
    {
      title: 'Subscribing to valueChanges without teardown',
      wrong: 'constructor() {\n  this.form.valueChanges.subscribe(v => this.doSomething(v));\n  // subscription never cleaned up — memory leak on destroy\n}',
      right: 'constructor() {\n  this.form.valueChanges.pipe(\n    takeUntilDestroyed()\n  ).subscribe(v => this.doSomething(v));\n}',
      explanation: 'valueChanges is a long-lived Observable. Without takeUntilDestroyed() (or an explicit unsubscribe), the subscription leaks after the component is destroyed.',
    },
  ];

  challenge: Challenge = {
    title: 'Registration Form with Custom Validator',
    description: 'Build a reactive form with name, email, password, and confirmPassword fields. Add a cross-field validator that ensures the passwords match.',
    language: 'typescript',
    hints: [
      'Use fb.group() with a second argument for group-level validators',
      'Group validators receive the AbstractControl (the FormGroup itself)',
      'Access sibling controls via control.get("fieldName")',
    ],
    starterCode: `import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { inject } from '@angular/core';

export class RegisterComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name:            ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  // TODO: add a cross-field validator that checks passwords match
}`,
    solution: `function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw  = control.get('password')?.value;
  const cpw = control.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

export class RegisterComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name:            ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  get mismatch() { return this.form.hasError('mismatch') && this.form.get('confirmPassword')?.dirty; }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular has two form approaches: template-driven (ngModel, simpler) and reactive (FormBuilder, type-safe, testable) — prefer reactive for anything beyond trivial forms.',
    mustKnow: [
      'Reactive forms define the model in the class with FormBuilder.group(); bind to the template with [formGroup] and formControlName.',
      'Template-driven forms use FormsModule + [(ngModel)] — Angular creates FormControls implicitly; access state via #ref="ngModel".',
      'Always call form.markAllAsTouched() on submit to show all validation errors at once.',
      'Group-level validators (cross-field) attach errors to form.errors, not individual control.errors.',
      'form.value omits disabled controls; form.getRawValue() includes all controls with their current values.',
      'Subscribe to valueChanges with takeUntilDestroyed() to avoid memory leaks; convert to signal with toSignal() for use in computed().',
    ],
    interviewFocus: [
      'Reactive vs template-driven — when to choose each, and the trade-offs (testability, boilerplate, type safety).',
      'Cross-field validators — applied to FormGroup, errors on form.errors not control.errors.',
      'What markAllAsTouched() does and why you must call it on submit.',
      'Typed Forms (Angular 14+) — what you gain and how FormBuilder.group() infers types.',
    ],
  };
}
