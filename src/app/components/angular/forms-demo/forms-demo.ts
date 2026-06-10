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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

interface SubmittedData {
  source: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-forms-demo',
  imports: [ReactiveFormsModule, FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './forms-demo.html',
  styleUrl: './forms-demo.scss',
})
export class FormsDemo {
  private fb = inject(FormBuilder);

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

  // ── Password cross-field demo ───────────────────────────────────────────────
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
        'Template-driven forms use FormsModule + [(ngModel)] — Angular creates FormControls implicitly.',
        'Validation is done via HTML attributes: required, minlength, pattern, email.',
        'Access control state via template reference: #email="ngModel" then email.invalid.',
        'Best for simple forms — less boilerplate but harder to unit-test and type-check.',
      ],
    },
    {
      heading: 'Reactive forms',
      points: [
        'Reactive forms use ReactiveFormsModule + FormBuilder to create an explicit model in the class.',
        'FormGroup.get(\'field\') accesses a control; .value, .valid, .touched are all typed.',
        'Add validators as an array: fb.control(\'\', [Validators.required, Validators.email]).',
        'Best for complex, dynamic, and testable forms — the model lives in the class, not the template.',
      ],
    },
    {
      heading: 'Validation & error display',
      points: [
        'control.hasError(\'required\') checks a specific validator error — avoids showing generic messages.',
        'control.touched ensures errors only show after the user has interacted with the field.',
        'async validators return Observable<ValidationErrors | null> — Angular shows PENDING status.',
        'FormGroup-level validators (cross-field) receive the group — use group.get(\'field\') inside.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Do not use ngModel inside a ReactiveFormsModule form — they conflict.',
        'form.patchValue({ key: val }) sets partial values; form.setValue requires all keys.',
        'form.valueChanges is an Observable — pipe it through debounceTime for live auto-save.',
        'Typed forms (Angular 14+): FormGroup<{ name: FormControl<string> }> gives compile-time safety.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'When should you use template-driven vs reactive forms?', a: 'Use <strong>template-driven</strong> for simple forms with minimal logic. Use <strong>reactive</strong> for complex forms, dynamic fields, custom validators, or when you need to unit-test form logic independently of the DOM.' },
    { q: 'How do you set an initial value in a reactive form?', a: '<code>fb.control(\'initialValue\')</code> or <code>form.patchValue({ fieldName: \'value\' })</code> after creation. Use <code>setValue</code> to set ALL fields at once (throws if a key is missing); use <code>patchValue</code> for partial updates.' },
    { q: 'What does form.markAllAsTouched() do?', a: 'It marks every control as touched — triggering all validation error messages to display. Call it on form submit to show all errors at once instead of waiting for each field to be touched individually.' },
    { q: 'How do you disable a form field?', a: '<code>control.disable()</code> in code, or <code>fb.control({ value: \'\', disabled: true })</code> at creation. Note: <code>form.value</code> omits disabled fields — use <code>form.getRawValue()</code> to include them.' },
    { q: 'What is the difference between valid, invalid, pending, and disabled status?', a: '<code>valid</code> — all validators pass. <code>invalid</code> — at least one fails. <code>pending</code> — async validator in flight. <code>disabled</code> — control is disabled (not validated). Check with <code>control.status</code>.' },
    { q: 'How do you listen for value changes reactively?', a: '<code>form.get(\'email\').valueChanges.pipe(debounceTime(300)).subscribe(val => this.check(val))</code>. Or convert to signal: <code>toSignal(form.valueChanges, { initialValue: form.value })</code>.' },
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
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormBuilder', type: 'class', desc: 'Injectable service that provides shorthand methods (group, control, array) to create reactive form instances.' , since: '2'},
    { name: 'FormGroup', type: 'class', desc: 'Tracks the value and validity state of a group of FormControl instances as one object.' , since: '2'},
    { name: 'FormControl', type: 'class', desc: 'Tracks the value, validation status, and UI state (touched/dirty) of a single form input.' , since: '2'},
    { name: 'Validators', type: 'class', desc: 'Built-in validator functions (required, email, minLength, maxLength, pattern) used in reactive and template-driven forms.' , since: '2'},
    { name: 'AbstractControl', type: 'class', desc: 'Base class for FormControl, FormGroup, and FormArray — used as the parameter type in custom validator functions.' , since: '2'},
    { name: 'ReactiveFormsModule', type: 'class', desc: 'Module that provides directives such as formGroup, formControlName, and formArrayName for binding reactive form models to the template.' , since: '2'},
    { name: 'FormsModule', type: 'class', desc: 'Module that enables template-driven forms via ngModel and ngForm directives.' , since: '2'},
    { name: 'formControlName', type: 'directive', desc: 'Binds a named FormControl inside a parent formGroup directive to an input element.' , since: '2'},
    { name: 'ngModel', type: 'directive', desc: 'Two-way binding directive used in template-driven forms to sync an input with a component property.' , since: '2'},
    { name: 'ValidationErrors', type: 'interface', desc: 'Type alias (Record<string, any>) returned by a validator function when validation fails, or null when it passes.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Typed Forms (Angular 14+): untyped vs typed FormGroup', before: '// Angular 13 and earlier — no generic type, values are \'any\'\nform = new FormGroup({\n  name: new FormControl(\'\'),\n  email: new FormControl(\'\'),\n});\nconst name: any = form.get(\'name\').value;', after: '// Angular 14+ — FormControl<string> gives compile-time safety\nform = this.fb.group({\n  name:  [\'\', Validators.required],\n  email: [\'\', [Validators.required, Validators.email]],\n});\nconst name: string | null = this.form.controls.name.value;',
      note: 'FormBuilder.group() infers types from initial values in Angular 14+.' },
    { title: 'Injecting FormBuilder: constructor vs inject()', before: '// Old pattern — constructor injection\nconstructor(private fb: FormBuilder) {}\nform = this.fb.group({ name: [\'\'] });', after: '// Modern pattern — inject() function (Angular 14+)\nprivate fb = inject(FormBuilder);\nform = this.fb.group({ name: [\'\'] });',
      note: 'inject() works at field-initializer level, removing the need for a constructor.' },
    { title: 'Template conditional error display: *ngIf vs @if', before: '<!-- Angular 16 and earlier -->\n<span *ngIf="rf[\'name\'].touched && rf[\'name\'].errors?.[\'required\']">\n  Name is required.\n</span>', after: '<!-- Angular 17+ built-in control flow -->\n@if (rf[\'name\'].touched && rf[\'name\'].errors?.[\'required\']) {\n  <span>Name is required.</span>\n}',
      note: '@if is the recommended syntax from Angular 17 onwards; *ngIf still works but is legacy.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mixing ngModel inside a reactive form', wrong: '// ReactiveFormsModule imported — then using ngModel too\n<input formControlName=\'email\' [(ngModel)]=\'model.email\' />', right: '// Use EITHER formControlName (reactive) OR ngModel (template-driven)\n<input formControlName=\'email\' />', explanation: 'ngModel and formControlName conflict inside the same form. Pick one approach per form; using both causes unexpected binding and console errors.'  },
    { title: 'Checking form.errors for a group-level validator on the wrong node', wrong: '// Cross-field \'mismatch\' error is on the FormGroup, not the control\n@if (pf[\'confirm\'].errors?.[\'mismatch\']) { <span>No match</span> }', right: '// Read group-level errors from the FormGroup itself\n@if (form.errors?.[\'mismatch\'] && pf[\'confirm\'].touched) {\n  <span>Passwords do not match.</span>\n}', explanation: 'Group validators attach errors to the FormGroup, not individual controls. Always read them via form.errors, not control.errors.'  },
    { title: 'Using form.value instead of form.getRawValue() when fields are disabled', wrong: '// \'username\' is disabled — it is MISSING from form.value\nconst payload = this.form.value;\nconsole.log(payload.username); // undefined', right: '// getRawValue() includes disabled controls\nconst payload = this.form.getRawValue();\nconsole.log(payload.username); // \'jdoe\'', explanation: 'Angular omits disabled controls from form.value to prevent accidental submission. Use getRawValue() when you need all field values regardless of disabled state.'  },
    { title: 'Forgetting markAllAsTouched() on submit — errors stay hidden', wrong: 'submit() {\n  if (this.form.invalid) return; // errors never shown if user clicked Submit directly\n}', right: 'submit() {\n  this.form.markAllAsTouched(); // reveals all validation errors at once\n  if (this.form.invalid) return;\n}', explanation: 'Validation error messages are conditionally shown only when a field is \'touched\'. Without markAllAsTouched(), users who click Submit without touching every field see no feedback.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '14', label: 'Strictly Typed Reactive Forms', features: ['FormControl<T>, FormGroup<T>, FormArray<T> now carry generic type parameters', 'FormBuilder.group() infers control types from initial values automatically', 'UntypedFormControl / UntypedFormGroup provided for gradual migration', 'form.value and form.getRawValue() return typed objects instead of \'any\''] },
    { version: '17', label: 'Built-in Control Flow in Templates', features: ['@if replaces *ngIf for showing/hiding validation error messages', '@for replaces *ngFor for rendering dynamic form arrays', 'No NgIf or NgFor import needed — syntax is part of the compiler'] },
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
}
