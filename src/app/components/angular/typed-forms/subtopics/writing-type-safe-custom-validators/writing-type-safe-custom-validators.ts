import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-writing-type-safe-custom-validators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './writing-type-safe-custom-validators.html',
  styleUrl: './writing-type-safe-custom-validators.scss',
})
export class WritingTypeSafeCustomValidatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ValidatorFn\'s built-in signature is already generic-friendly — most custom validators lose typing unnecessarily',
      points: [
        'Angular\'s <code>ValidatorFn</code> type is <code>(control: AbstractControl) =&gt; ValidationErrors | null</code> — note <code>AbstractControl</code>, NOT <code>AbstractControl&lt;unknown&gt;</code> or a specific type. Most tutorials write validators exactly to this base signature, which means <code>control.value</code> inside the validator body is typed as <code>any</code> even when the validator is only ever attached to a <code>FormControl&lt;string&gt;</code>.',
        'A GENERIC validator FACTORY recovers full typing: <code>function minLengthTyped&lt;T extends string&gt;(min: number): ValidatorFn { return (control: AbstractControl&lt;T&gt;) =&gt; control.value.length &lt; min ? { minLengthTyped: { required: min, actual: control.value.length } } : null; }</code> — the factory\'s type parameter <code>T</code> flows into the returned closure\'s <code>control</code> parameter, giving <code>control.value</code> a real type instead of <code>any</code>.',
      ],
    },
    {
      heading: 'Cross-field validators on a typed FormGroup — accessing sibling controls with full typing',
      points: [
        'A cross-field validator (e.g. "password and confirmPassword must match") is attached at the GROUP level, not the control level: <code>ValidatorFn</code> whose <code>control</code> parameter is typed as the specific <code>FormGroup&lt;{...}&gt;</code> shape rather than the generic <code>AbstractControl</code> — this lets <code>control.controls.password.value</code> and <code>control.controls.confirmPassword.value</code> both be correctly typed as <code>string</code>, with autocomplete on the sibling control names.',
        'Write it as a factory taking the two control-name KEYS as generic string-literal arguments when you want the SAME validator reused across multiple typed groups with different field names: <code>function fieldsMatch&lt;T extends Record&lt;string, AbstractControl&gt;, K1 extends keyof T, K2 extends keyof T&gt;(key1: K1, key2: K2): ValidatorFn</code> — this is more advanced generics than most form validators need, but is the correct approach for a REUSABLE cross-field validator library.',
      ],
    },
    {
      heading: 'Typed AsyncValidatorFn — an async check that still knows its control\'s type',
      points: [
        '<code>AsyncValidatorFn</code> follows the identical typing pattern as <code>ValidatorFn</code>, just returning an <code>Observable&lt;ValidationErrors | null&gt;</code> or a <code>Promise</code> instead: <code>function uniqueUsernameValidator(api: UserApiService): AsyncValidatorFn { return (control: AbstractControl&lt;string&gt;) =&gt; api.checkUsernameAvailable(control.value).pipe(map(available =&gt; available ? null : { usernameTaken: true })); }</code> — <code>control.value</code> is <code>string</code>, not <code>any</code>, matching the control it is meant to be attached to.',
        'Register async validators as the THIRD constructor argument (not mixed into the sync validators array): <code>new FormControl(\'\', { nonNullable: true, validators: [Validators.required], asyncValidators: [uniqueUsernameValidator(api)] })</code> — Angular runs sync validators first; async validators only run if all sync validators pass, avoiding wasted network calls on an already-invalid value.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/validators.ts',
      content: `import { AbstractControl, ValidatorFn, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// ── Typed single-control validator factory ─────────────────────────────
export function minLengthTyped(min: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value; // typed as string, not any
    return value.length < min
      ? { minLengthTyped: { required: min, actual: value.length } }
      : null;
  };
}

// ── Typed cross-field validator on a specific FormGroup shape ──────────
interface PasswordGroupShape {
  password: AbstractControl<string>;
  confirmPassword: AbstractControl<string>;
}

export function passwordsMatch(): ValidatorFn {
  return (control: AbstractControl<unknown>): ValidationErrors | null => {
    const group = control as unknown as { controls: PasswordGroupShape };
    const pw = group.controls.password.value;   // typed as string
    const confirm = group.controls.confirmPassword.value; // typed as string
    return pw === confirm ? null : { passwordsMismatch: true };
  };
}

// ── Typed async validator ────────────────────────────────────────────
export function uniqueUsername(taken: string[]): AsyncValidatorFn {
  return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    const username = control.value; // typed as string
    return of(taken.includes(username) ? { usernameTaken: true } : null).pipe(delay(300));
  };
}
`,
    },
    {
      path: 'src/app/signup-form.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { minLengthTyped, passwordsMatch, uniqueUsername } from './validators';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form">
      <label>Username
        <input formControlName="username" />
        @if (form.controls.username.pending) { <span>Checking…</span> }
        @if (form.controls.username.errors?.['usernameTaken']) { <span>Taken!</span> }
      </label>
      <label>Password <input formControlName="password" type="password" /></label>
      <label>Confirm  <input formControlName="confirmPassword" type="password" /></label>
      @if (form.errors?.['passwordsMismatch']) { <p>Passwords do not match</p> }
    </form>
  \`,
})
export class SignupFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    username: this.fb.nonNullable.control('', {
      validators: [Validators.required, minLengthTyped(4)],
      asyncValidators: [uniqueUsername(['admin', 'root'])],
    }),
    password: this.fb.nonNullable.control('', [Validators.required, minLengthTyped(8)]),
    confirmPassword: this.fb.nonNullable.control(''),
  }, { validators: passwordsMatch() });
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { SignupFormComponent } from './signup-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SignupFormComponent],
  template: \`
    <h3>Type-safe custom validators</h3>
    <p>Try "admin" or "root" as a username (async, taken), mismatched passwords
    (group-level cross-field validator), or a short password (typed sync validator).</p>
    <app-signup-form />
  \`,
})
export class App {}
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
  <head><title>Writing type-safe custom validators</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a typed maxLengthTyped(max) validator factory, mirroring minLengthTyped, and apply it to the username field.',
    hint: 'Copy minLengthTyped\'s structure, invert the comparison to value.length > max, and add it to the username control\'s validators array alongside minLengthTyped(4).',
    solution: `export function maxLengthTyped(max: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    return value.length > max
      ? { maxLengthTyped: { max, actual: value.length } }
      : null;
  };
}

// signup-form.ts
username: this.fb.nonNullable.control('', {
  validators: [Validators.required, minLengthTyped(4), maxLengthTyped(20)],
  asyncValidators: [uniqueUsername(['admin', 'root'])],
}),`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'writing a custom validator to Angular\'s base ValidatorFn signature automatically gives control.value a real type.',
      reality: 'ValidatorFn\'s base signature types control as plain AbstractControl, giving control.value type any — a GENERIC validator factory with an explicit AbstractControl<T> parameter is needed to recover real typing.',
    },
    {
      thought: 'async validators run alongside sync validators, so both incur their cost even on an obviously invalid value.',
      reality: 'Angular runs sync validators FIRST — async validators only run once all sync validators pass, avoiding wasted network calls (like a uniqueness check) on a value that is already invalid for a simpler reason.',
    },
    {
      thought: 'a cross-field validator (like passwords must match) belongs on one of the two individual controls being compared.',
      reality: 'it belongs on the GROUP level, since it needs to read both sibling controls\' values — attaching it to a single control would leave it unable to see the other field.',
    },
  ];
}
