import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
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

// ── Sync validators ────────────────────────────────────────────────────────
function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return /\s/.test(control.value ?? '') ? { noSpaces: 'Username cannot contain spaces' } : null;
}

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  if (!v) return null;
  const errors: Record<string, string> = {};
  if (v.length < 8)             errors['minLength']  = 'At least 8 characters';
  if (!/[A-Z]/.test(v))        errors['uppercase']  = 'At least one uppercase letter';
  if (!/[0-9]/.test(v))        errors['number']     = 'At least one number';
  if (!/[^A-Za-z0-9]/.test(v)) errors['special']   = 'At least one special character (!@#$...)';
  return Object.keys(errors).length ? errors : null;
}

// ── Cross-field validator ──────────────────────────────────────────────────
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pwd     = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordMismatch: 'Passwords do not match' } : null;
}

// ── Async validator (simulates HTTP username-exists check) ─────────────────
const TAKEN = ['admin', 'angular', 'karthik', 'user', 'root'];

function uniqueUsernameValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(600).pipe(
      switchMap(() => of((control.value as string).toLowerCase())),
      map(name => TAKEN.includes(name) ? { usernameTaken: `"${control.value}" is already taken` } : null)
    );
}

@Component({
  selector: 'app-custom-validators',
  imports: [
    ReactiveFormsModule, JsonPipe, CodeBlockComponent, TheoryBlockComponent,
    QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './custom-validators.html',
  styleUrl: './custom-validators.scss',
})
export class CustomValidatorsDemo {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Forms (Reactive & Template)', route: '/angular/forms-demo' },
    { label: 'Form Array', route: '/angular/form-array' },
  ];

  form = this.fb.group(
    {
      username: ['', [Validators.required, noSpacesValidator], [uniqueUsernameValidator()]],
      password: ['', [Validators.required, strongPasswordValidator]],
      confirm:  ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  result = signal<object | null>(null);

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }
  get confirm()  { return this.form.get('confirm')!; }

  getErrors(ctrl: AbstractControl): string[] {
    if (!ctrl.errors) return [];
    return Object.values(ctrl.errors).filter((v): v is string => typeof v === 'string');
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) this.result.set(this.form.value);
  }

  theory: TheoryPoint[] = [
    {
      heading: 'Sync validators — the basics',
      points: [
        'A sync validator is a plain function: <code>(control: AbstractControl): ValidationErrors | null</code>.',
        'Return <code>null</code> for valid — return an object like <code>{ myError: true }</code> or <code>{ myError: \'message\' }</code> for invalid.',
        'Pass as the second argument to <code>FormControl</code>: <code>fb.control(\'\', [Validators.required, myValidator])</code>.',
        'Multiple validators run in order and all errors are merged — a validator can also return multiple error keys at once in a single object.',
        'Always guard against empty values: <code>if (!control.value) return null;</code> — let <code>Validators.required</code> handle the empty case separately.',
      ],
    },
    {
      heading: 'Parameterized validator factories',
      points: [
        'A validator factory is a function that accepts parameters and returns a <code>ValidatorFn</code>: <code>function minAge(min: number): ValidatorFn { return (c) => ...; }</code>.',
        'Use the factory at registration: <code>fb.control(\'\', [Validators.required, minAge(18)])</code> — the returned function is the actual validator.',
        'Factories enable reuse with different thresholds: <code>minWords(10)</code>, <code>maxWords(500)</code>, <code>forbiddenValue(\'admin\')</code>.',
        'Include the failing value in the error object for better UX: <code>{ minAge: { required: min, actual: c.value } }</code> — accessible in the template.',
        '<code>Validators.min(n)</code> and <code>Validators.minLength(n)</code> are examples of built-in parameterized factories — your custom ones follow the exact same pattern.',
      ],
    },
    {
      heading: 'Async validators',
      points: [
        'Async validators return <code>Observable&lt;ValidationErrors | null&gt;</code> or <code>Promise&lt;ValidationErrors | null&gt;</code> — passed as the <strong>third</strong> argument to a control.',
        'Angular waits for the observable to complete before marking the control valid/invalid; while pending, <code>control.status === \'PENDING\'</code>.',
        'Always debounce async validators with <code>timer(600).pipe(switchMap(...))</code> — <code>switchMap</code> cancels any in-flight request when a new value arrives.',
        'Return the validator wrapped in a factory function so each call creates a fresh closure — do not pass the inner function directly, as it would share state.',
        'Use <code>updateOn: \'blur\'</code> to run validation only when the field loses focus: <code>fb.control(\'\', [], [asyncValidator()], { updateOn: \'blur\' })</code>.',
      ],
    },
    {
      heading: 'Cross-field (group) validators',
      points: [
        'Apply to the <code>FormGroup</code> directly: <code>fb.group({...}, { validators: myGroupValidator })</code> — the validator receives the entire group as its <code>AbstractControl</code>.',
        'Access any child field: <code>group.get(\'fieldName\')?.value</code> — the validator can compare, combine, or relate any number of fields.',
        'Errors are attached to the <code>FormGroup</code>, not any child — display them with <code>form.errors?.[\'myError\']</code>.',
        'To show the error on a specific child control instead, call <code>childCtrl.setErrors({ mismatch: true })</code> inside the group validator — but clear it on success with <code>setErrors(null)</code>.',
        'Multiple group validators can be passed as an array: <code>{ validators: [passwordMatch, dateRangeValid] }</code>.',
      ],
    },
    {
      heading: 'Displaying validation errors in the template',
      points: [
        'Guard all error display with <code>control.touched</code> (or <code>control.dirty</code>) — controls are invalid on load, so errors must not show until the user interacts.',
        'Call <code>form.markAllAsTouched()</code> on submit to reveal all un-touched errors at once when the user clicks submit without filling every field.',
        'Use <code>control.hasError(\'key\')</code> for single-error guards; iterate <code>Object.values(control.errors!)</code> to display all errors from a multi-rule validator.',
        'Show PENDING state for async validators: <code>@if (username.pending) { &lt;span&gt;Checking…&lt;/span&gt; }</code>.',
        'For cross-field errors: <code>@if (form.errors?.[\'passwordMismatch\'] && confirm.touched)</code> — the error lives on the group, not the child control.',
      ],
    },
    {
      heading: 'Best practices and composition',
      points: [
        'Keep validators fast and pure — avoid I/O or shared mutable state in sync validators; use async validators for anything that needs a network call.',
        'Use <code>Validators.compose([a, b])</code> to merge multiple validators into one where APIs expect a single <code>ValidatorFn</code>.',
        'Programmatically clear an error with <code>ctrl.setErrors(null)</code> — useful when a group validator sets errors on a child and needs to clear them on correction.',
        'Test validators as pure functions: pass a mock <code>AbstractControl</code> with a <code>value</code> property and assert the return value — no DOM needed.',
        'When a validator must read another service\'s state (e.g. current locale, user role), use a factory and inject the service via closure or <code>inject()</code>.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What does a custom validator function return?', a: 'Return <code>null</code> if valid (no error). Return a <code>ValidationErrors</code> object if invalid: <code>{ myError: { value: control.value } }</code>. Angular checks for the error key in the template: <code>control.hasError(\'myError\')</code>.' },
    { q: 'How do you create a parameterised validator?', a: 'Return a factory function: <code>function minAge(min: number): ValidatorFn { return (c) => +c.value >= min ? null : { minAge: { min, actual: c.value } }; }</code>. Use: <code>[Validators.required, minAge(18)]</code>.' },
    { q: 'What is an async validator and when do you use it?', a: 'An async validator returns <code>Observable&lt;ValidationErrors | null&gt;</code> or <code>Promise&lt;ValidationErrors | null&gt;</code>. Use for server-side uniqueness checks (username taken). Angular shows <code>PENDING</code> status while the check runs.' },
    { q: 'How do you prevent an async validator from firing on every keystroke?', a: 'Debounce inside the validator with <code>timer(400).pipe(switchMap(...))</code> — switchMap cancels in-flight calls when a new value arrives. Alternatively, use <code>updateOn: \'blur\'</code> on the control so async validation only runs when the field loses focus.' },
    { q: 'How do cross-field validators work in Angular?', a: 'Apply a validator to the <code>FormGroup</code>, not a control: <code>fb.group({ pass, confirm }, { validators: [passwordMatch] })</code>. The validator receives the group — access both fields with <code>group.get(\'pass\')</code> and <code>group.get(\'confirm\')</code>.' },
    { q: 'How do you display cross-field validator errors in the template?', a: 'Check the group\'s errors, not a control\'s: <code>form.hasError(\'passwordMismatch\')</code>. Display the message outside both fields, near the submit button or in a summary section.' },
    { q: 'How do you programmatically clear a custom error set on a control?', a: 'Call <code>ctrl.setErrors(null)</code> — this removes ALL errors set on that control, including those placed by Angular\'s own validators. To clear only one custom error while preserving others, merge the current errors and delete the key: <code>const e = { ...ctrl.errors }; delete e[\'myKey\']; ctrl.setErrors(Object.keys(e).length ? e : null)</code>.' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sync validator',
      language: 'typescript',
      code: `// A validator is a plain function: AbstractControl → errors | null
function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return /\\s/.test(control.value)
    ? { noSpaces: 'Username cannot contain spaces' }
    : null;
}

// Multi-rule validator (password strength)
function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  const errors: Record<string, string> = {};
  if (v.length < 8)      errors['minLength'] = 'At least 8 characters';
  if (!/[A-Z]/.test(v)) errors['uppercase'] = 'One uppercase letter';
  if (!/[0-9]/.test(v)) errors['number']    = 'One number';
  return Object.keys(errors).length ? errors : null;
}

// Use in FormControl (2nd arg = sync validators array):
this.fb.control('', [Validators.required, noSpacesValidator])`,
    },
    {
      label: 'Parameterized factory',
      language: 'typescript',
      code: `import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

// Factory returns a ValidatorFn — accepts configuration params
function minWordsValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const words = (control.value as string)?.trim().split(/\\s+/).filter(Boolean) ?? [];
    return words.length >= min
      ? null
      : { minWords: \`Need at least \${min} words (you have \${words.length})\` };
  };
}

// Parameterized at registration — each use can have a different min
form = fb.group({
  summary: ['', [Validators.required, minWordsValidator(10)]],
  bio:     ['', [Validators.required, minWordsValidator(50)]],
});

// Access error data in template:
// {{ control.errors?.['minWords'] }}`,
    },
    {
      label: 'Async validator',
      language: 'typescript',
      code: `import { AsyncValidatorFn } from '@angular/forms';
import { timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

// Async validator returns Observable<ValidationErrors | null>
// timer() debounces — avoids an HTTP call on every keystroke
function uniqueUsernameValidator(): AsyncValidatorFn {
  return (control) =>
    timer(600).pipe(
      switchMap(() =>
        http.get<boolean>(\`/api/username/\${control.value}/taken\`)
      ),
      map(taken => taken ? { usernameTaken: 'Already taken' } : null)
    );
}

// 3rd argument to control/group is async validators:
fb.control('', [Validators.required], [uniqueUsernameValidator()])

// Show pending state in template:
// @if (username.pending) { <span>Checking…</span> }`,
    },
    {
      label: 'Cross-field validator',
      language: 'typescript',
      code: `// Applied to the FormGROUP, not individual controls
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pwd     = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pwd && confirm && pwd !== confirm
    ? { passwordMismatch: 'Passwords do not match' }
    : null;
}

// 2nd argument to fb.group() is group-level options:
form = fb.group({
  password: ['', strongPassword],
  confirm:  ['', Validators.required],
}, { validators: passwordMatchValidator });

// Error is on the GROUP, not a child control:
// @if (form.errors?.['passwordMismatch'] && confirm.touched) {
//   <p>{{ form.errors['passwordMismatch'] }}</p>
// }`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What must a synchronous custom validator function return to indicate a control is valid?', options: ['An empty object {}', 'The boolean value true', 'null', 'ValidationErrors with an empty string'], answer: 2, explanation: 'A sync validator must return null when the control value is valid. Returning any truthy object (even an empty one) marks the control as invalid. Only null signals \'no errors\'.' },
    { q: 'In the registration form, where is the passwordMatchValidator applied — and why?', options: ['On the confirm FormControl, because it is the field being validated', 'On the password FormControl, because it owns the original value', 'On the FormGroup itself, so it can read both password and confirm fields', 'On both controls simultaneously via Validators.compose()'], answer: 2, explanation: 'Cross-field validators are applied to the FormGroup (second argument of fb.group()), not to individual controls. This gives the validator access to the entire group via group.get(\'fieldName\'), allowing it to compare any two sibling controls.' },
    { q: 'What is the status of a FormControl while an async validator has not yet emitted?', options: ['INVALID', 'PENDING', 'VALIDATING', 'DISABLED'], answer: 1, explanation: 'Angular sets control.status to \'PENDING\' while an async validator\'s Observable or Promise has not completed yet. The template uses username.pending to show the \'Checking...\' badge.' },
    { q: 'Why does the uniqueUsernameValidator() use timer(600) before the switchMap?', options: ['To ensure the validator runs exactly once per component lifecycle', 'To debounce requests so an HTTP call is not made on every keystroke', 'Because Angular requires a minimum 600ms delay for all async validators', 'To prevent the validator from running while the control is pristine'], answer: 1, explanation: 'timer(600) introduces a 600ms delay. Combined with switchMap, any new emission (new keypress) cancels the previous timer, so the downstream call only fires when the user pauses typing for 600ms — avoiding a server request on every character.' },
    { q: 'When the strongPasswordValidator detects multiple problems (e.g., too short AND no uppercase), what does it return?', options: ['An array of error strings', 'Only the first error found, to keep validation simple', 'A single ValidationErrors object with multiple keys, one per problem', 'null, because multiple errors cannot be merged'], answer: 2, explanation: 'The validator builds a Record<string, string> named errors, adds one key per failing rule (minLength, uppercase, number, special), then returns the whole object if any keys exist. This lets the template iterate over all error messages simultaneously with @for.' },
    { q: 'What is the purpose of wrapping an async validator in a factory function?', options: ['To satisfy the AsyncValidatorFn type signature which requires a function', 'To create a fresh closure per call, avoiding shared state between controls', 'Because Angular requires all validators to be classes, not functions', 'To allow the validator to be synchronous at the component level'], answer: 1, explanation: 'An async validator factory (a function that returns a function) ensures each control gets its own closure — no shared state. If you pass the inner function directly without a factory wrapper, multiple controls would share the same closure scope, causing bugs.' },
    { q: 'How do you compose two ValidatorFn functions into a single one?', options: ['Validators.merge(a, b)', 'Validators.compose([a, b])', '[a, b] in the validators array works the same as composing', 'You cannot — validators must be applied separately'], answer: 1, explanation: 'Validators.compose([a, b]) merges multiple ValidatorFn functions into a single ValidatorFn that runs all of them and combines their errors. It is useful when an API accepts only a single ValidatorFn argument (e.g. the second arg to FormArray).' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ValidatorFn', type: 'interface', desc: 'Type alias for a synchronous validator function: (control: AbstractControl) => ValidationErrors | null.', since: '2' },
    { name: 'AsyncValidatorFn', type: 'interface', desc: 'Type alias for an async validator function that returns Observable<ValidationErrors | null> or Promise<ValidationErrors | null>.', since: '2' },
    { name: 'AbstractControl', type: 'class', desc: 'Base class for FormControl, FormGroup, and FormArray; passed into every validator function as the argument.', since: '2' },
    { name: 'ValidationErrors', type: 'interface', desc: 'A plain object map of error keys to error values returned by a failing validator, e.g. { required: true } or { minLength: \'Too short\' }.', since: '2' },
    { name: 'Validators', type: 'class', desc: 'Built-in static validator functions (required, minLength, pattern, etc.) that can be composed alongside custom validators.', since: '2' },
    { name: 'AbstractControl.setErrors()', type: 'method', desc: 'Programmatically sets or clears errors on a control; call setErrors(null) to remove a custom error set by a group validator.', since: '2' },
    { name: 'AbstractControl.hasError()', type: 'method', desc: 'Returns true if the control currently has the named error key, used in templates to conditionally show error messages.', since: '2' },
    { name: 'FormGroup validators option', type: 'token', desc: 'The second argument to fb.group() or new FormGroup() accepts { validators, asyncValidators } for cross-field group-level validation.', since: '2' },
    { name: 'control.pending', type: 'accessor', desc: 'True when the control\'s async validators have not yet emitted — use to show a loading spinner in the template.', since: '2' },
    { name: 'Validators.compose()', type: 'method', desc: 'Merges an array of ValidatorFn into a single ValidatorFn, combining all returned error objects; useful for building validator factories.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Inline validation logic vs. named validator function',
      before: '// Old: ad-hoc logic scattered in the component\nthis.form.get(\'username\')!.valueChanges.subscribe(v => {\n  if (/\\s/.test(v)) this.usernameError = \'No spaces allowed\';\n  else this.usernameError = \'\';\n});',
      after: '// New: reusable pure validator function\nfunction noSpacesValidator(c: AbstractControl): ValidationErrors | null {\n  return /\\s/.test(c.value ?? \'\') ? { noSpaces: \'No spaces allowed\' } : null;\n}\nfb.control(\'\', [Validators.required, noSpacesValidator]);',
    },
    {
      title: 'Async validator without debounce vs. with timer debounce',
      before: '// Old: fires an HTTP call on every single keystroke\nfunction checkUsername(c: AbstractControl) {\n  return http.get(\'/api/check/\' + c.value).pipe(\n    map(taken => taken ? { usernameTaken: true } : null)\n  );\n}',
      after: '// New: debounced with timer + switchMap to cancel in-flight calls\nfunction checkUsername(): AsyncValidatorFn {\n  return (c) => timer(600).pipe(\n    switchMap(() => http.get(\'/api/check/\' + c.value)),\n    map(taken => taken ? { usernameTaken: \'Already taken\' } : null)\n  );\n}',
    },
    {
      title: 'Cross-field error on child control vs. on FormGroup',
      before: '// Old: manually subscribing and patching the confirm control\nthis.form.valueChanges.subscribe(() => {\n  const match = this.form.value.password === this.form.value.confirm;\n  this.form.get(\'confirm\')!.setErrors(match ? null : { mismatch: true });\n});',
      after: '// New: group-level validator, error lives on the group\nfunction passwordMatch(g: AbstractControl): ValidationErrors | null {\n  const a = g.get(\'password\')?.value, b = g.get(\'confirm\')?.value;\n  return a && b && a !== b ? { passwordMismatch: \'Passwords must match\' } : null;\n}\nfb.group({ password: \'\', confirm: \'\' }, { validators: passwordMatch });',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning an empty object instead of null for a valid control',
      wrong: 'function myValidator(c: AbstractControl): ValidationErrors | null {\n  if (isValid(c.value)) return {}; // BUG: {} is truthy\n  return { myError: true };\n}',
      right: 'function myValidator(c: AbstractControl): ValidationErrors | null {\n  if (isValid(c.value)) return null; // null = no error\n  return { myError: true };\n}',
      explanation: 'Angular treats any non-null return value — including an empty object — as a validation failure. You must return exactly null to signal that the control is valid.',
    },
    {
      title: 'Applying a cross-field validator to a child control instead of the group',
      wrong: 'fb.group({\n  password: [\'\', [Validators.required, passwordMatchValidator]],\n  confirm:  [\'\', Validators.required],\n});',
      right: 'fb.group({\n  password: [\'\', Validators.required],\n  confirm:  [\'\', Validators.required],\n}, { validators: passwordMatchValidator });',
      explanation: 'A cross-field validator receives an AbstractControl argument. When applied to a single FormControl it cannot access sibling fields. It must be applied to the FormGroup so it receives the group and can call group.get(\'fieldName\').',
    },
    {
      title: 'Forgetting to debounce async validators, causing a request on every keystroke',
      wrong: 'function uniqueEmail(): AsyncValidatorFn {\n  return (c) => http.get(\'/api/check?email=\' + c.value).pipe(\n    map(taken => taken ? { emailTaken: true } : null)\n  );\n}',
      right: 'function uniqueEmail(): AsyncValidatorFn {\n  return (c) => timer(400).pipe(\n    switchMap(() => http.get(\'/api/check?email=\' + c.value)),\n    map(taken => taken ? { emailTaken: true } : null)\n  );\n}',
      explanation: 'Without a debounce delay (timer + switchMap), Angular fires the async validator on every value change, sending one HTTP request per keystroke. timer() combined with switchMap cancels any in-flight request when a new value arrives.',
    },
    {
      title: 'Showing errors on initial load before the user has interacted',
      wrong: '@if (control.invalid) {\n  <p class=\'err\'>{{ control.errors | json }}</p>\n}',
      right: '@if (control.invalid && control.touched) {\n  <p class=\'err\'>{{ control.errors | json }}</p>\n}',
      explanation: 'Controls are invalid on initial load if they have required or other validators. Guard error display with control.touched (or control.dirty) so errors only appear after the user has interacted with the field.',
    },
    {
      title: 'Passing an async validator factory without calling it',
      wrong: '// WRONG — passing the factory itself, not the ValidatorFn it returns\nfb.control(\'\', [], [uniqueUsernameValidator])',
      right: '// RIGHT — call the factory to get the AsyncValidatorFn\nfb.control(\'\', [], [uniqueUsernameValidator()])',
      explanation: 'uniqueUsernameValidator is a factory that returns the actual AsyncValidatorFn. Passing the factory reference (without parentheses) gives Angular the outer function, which doesn\'t match the AsyncValidatorFn signature and silently fails to validate.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Parameterized minWords Validator',
    description: 'Create a parameterized validator factory called minWordsValidator(min: number) that rejects a textarea if it contains fewer than min words. Then wire it into a reactive FormGroup alongside Validators.required. Display each error message in the template.',
    language: 'typescript',
    hints: [
      'A validator factory is just a function that accepts parameters and returns a ValidatorFn: (control: AbstractControl) => ValidationErrors | null.',
      'Split the control value on whitespace and filter out empty strings: value.trim().split(/\\s+/).filter(Boolean).length.',
      'Return null when the word count is sufficient; return an object like { minWords: \'Need at least N words\' } when it is not.',
      'Apply the validator in fb.group as the second argument to the field array: [\'\', [Validators.required, minWordsValidator(10)]].',
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// TODO 1: Create a minWordsValidator factory.
// It accepts a number (min) and returns a ValidatorFn.
// Return null when word count >= min.
// Return { minWords: \`Need at least \${min} words\` } otherwise.
function minWordsValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // your code here
    return null;
  };
}

@Component({
  selector: 'app-min-words',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Bio (at least 10 words)</label>
      <textarea formControlName="bio" rows="4" placeholder="Tell us about yourself..."></textarea>

      <!-- TODO 2: Show the 'required' error when bio is touched and has that error -->
      <!-- TODO 3: Show the 'minWords' error message when bio is touched and has that error -->

      <button type="submit">Submit</button>
    </form>

    @if (submitted) {
      <p class="success">Form submitted successfully!</p>
    }
  \`,
})
export class MinWordsDemo {
  private fb = inject(FormBuilder);

  // TODO 4: Add minWordsValidator(10) to the bio control
  form = this.fb.group({
    bio: ['', [Validators.required]],
  });

  submitted = false;

  get bio() { return this.form.get('bio')!; }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted = true;
  }
}`,
    solution: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function minWordsValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    const wordCount = value.trim().split(/\\s+/).filter(Boolean).length;
    return wordCount >= min ? null : { minWords: \`Need at least \${min} words (you have \${wordCount})\` };
  };
}

@Component({
  selector: 'app-min-words',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Bio (at least 10 words)</label>
      <textarea formControlName="bio" rows="4" placeholder="Tell us about yourself..."></textarea>

      @if (bio.touched && bio.errors?.['required']) {
        <p class="err">Bio is required.</p>
      }
      @if (bio.touched && bio.errors?.['minWords']) {
        <p class="err">{{ bio.errors['minWords'] }}</p>
      }

      <button type="submit">Submit</button>
    </form>

    @if (submitted) {
      <p class="success">Form submitted successfully!</p>
    }
  \`,
})
export class MinWordsDemo {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    bio: ['', [Validators.required, minWordsValidator(10)]],
  });

  submitted = false;

  get bio() { return this.form.get('bio')!; }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitted = true;
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Custom validators are plain functions returning ValidationErrors | null — sync for immediate checks, async for server lookups, and group-level for cross-field comparisons.',
    mustKnow: [
      'Sync validator signature: (control: AbstractControl): ValidationErrors | null — return null for valid, an object for invalid.',
      'Async validators go in the THIRD argument to fb.control(); they return Observable<ValidationErrors | null> and show PENDING status while running.',
      'Always debounce async validators with timer(ms).pipe(switchMap(...)) — switchMap cancels the prior call on each new value.',
      'Cross-field validators apply to the FormGroup (2nd arg to fb.group()); errors live on form.errors not on any child control.errors.',
      'Guard all error display with control.touched — controls are invalid on load so errors must not show before the user interacts.',
      'Call form.markAllAsTouched() on submit to force-show all hidden validation errors at once.',
    ],
    interviewFocus: [
      'Sync vs async validator — when to use each, and the full AsyncValidatorFn return type.',
      'Why cross-field validators live on the FormGroup and how to access their errors in the template.',
      'How to debounce an async validator and why switchMap cancels stale requests.',
      'Parameterized validator factories — how they differ from plain ValidatorFn and why you call them at registration.',
    ],
  };
}
