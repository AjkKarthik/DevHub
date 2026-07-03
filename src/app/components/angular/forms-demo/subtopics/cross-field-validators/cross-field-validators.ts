import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cross-field-validators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cross-field-validators.html',
  styleUrl: './cross-field-validators.scss',
})
export class CrossFieldValidatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A cross-field validator runs on the GROUP, not a single control',
      points: [
        'A single-control validator (like <code>Validators.email</code> or a custom one) can only ever see ONE field\'s value — it has no way to compare "password" against "confirm password". A cross-field validator solves this by being attached to the <code>FormGroup</code> itself, not to any individual control inside it.',
        'The function signature is the same shape as a normal validator — <code>(group: AbstractControl): ValidationErrors | null</code> — but the parameter IS the whole group, so <code>group.get(\'password\')?.value</code> and <code>group.get(\'confirm\')?.value</code> are both reachable in the same function.',
      ],
    },
    {
      heading: 'Attaching it — the second argument to fb.group()',
      points: [
        '<code>this.fb.group({ password: [...], confirm: [...] }, { validators: [passwordMatch] })</code> — the group-level validators go in the OPTIONS object, the second argument to <code>fb.group()</code>, completely separate from any individual field\'s own validators array.',
      ],
    },
    {
      heading: 'Reading the error — check form.errors, not a control\'s errors',
      points: [
        'A mismatch error set by a cross-field validator lives on <code>form.errors?.[\'mismatch\']</code> — the GROUP\'s errors, not <code>confirmControl.errors</code>. Checking the wrong one is the single most common mistake with cross-field validation; the individual "confirm" control can be perfectly valid on its own (non-empty, meets minLength) while the GROUP is still invalid because the two values do not match.',
        'Since there is no one control that "owns" a group-level error, the usual convention is to display it near the LAST field involved in the comparison, gated on THAT field\'s <code>touched</code> state — e.g. <code>form.errors?.[\'mismatch\'] && pf[\'confirm\'].touched</code> — so the message does not appear before the user has even reached the confirm field.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

// Cross-field validator — receives the FormGroup, compares two sibling fields
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pwd     = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pwd === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form">
      <input formControlName="password" type="password" placeholder="Password" />
      @if (pf.password.touched && pf.password.errors?.['minlength']) {
        <p>Min 6 characters.</p>
      }

      <input formControlName="confirm" type="password" placeholder="Confirm password" />
      <!-- Group-level error — form.errors, gated on the LAST field's touched state -->
      @if (form.errors?.['mismatch'] && pf.confirm.touched) {
        <p>Passwords do not match.</p>
      }

      <p>Form valid: {{ form.valid }}</p>
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm:  ['', Validators.required],
  }, { validators: [passwordMatch] });

  get pf() { return this.form.controls; }
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
  <head><title>Cross-field validators</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "username" field to the form and a cross-field validator that requires the password to NOT contain the username (a common real-world security rule). Show the error the same way as the mismatch error.',
    hint: 'function passwordNotUsername(group: AbstractControl): ValidationErrors | null { const pwd = group.get(\'password\')?.value ?? \'\'; const user = group.get(\'username\')?.value ?? \'\'; return user && pwd.toLowerCase().includes(user.toLowerCase()) ? { containsUsername: true } : null; } — add it alongside passwordMatch in the validators array: { validators: [passwordMatch, passwordNotUsername] }.',
    solution: `function passwordNotUsername(group: AbstractControl): ValidationErrors | null {
  const pwd  = group.get('password')?.value ?? '';
  const user = group.get('username')?.value ?? '';
  return user && pwd.toLowerCase().includes(user.toLowerCase())
    ? { containsUsername: true }
    : null;
}

form = this.fb.group({
  username: ['', Validators.required],
  password: ['', [Validators.required, Validators.minLength(6)]],
  confirm:  ['', Validators.required],
}, { validators: [passwordMatch, passwordNotUsername] });

// Template:
// @if (form.errors?.['containsUsername'] && pf.password.touched) {
//   <p>Password cannot contain your username.</p>
// }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a cross-field validator goes in the individual control\'s own validators array, like Validators.required.',
      reality: 'a cross-field validator is attached to the FormGroup itself, via the OPTIONS object (the second argument to fb.group()) — not to any single control\'s validators array. It needs to see multiple sibling fields, which a single control\'s own validator function cannot do.',
    },
    {
      thought: 'checking a cross-field validator\'s error works the same as any control error — just check confirmControl.errors.',
      reality: 'the error set by a group-level validator lives on form.errors (the GROUP), not on any individual control\'s own .errors. A confirm field can be independently valid (non-empty, right length) while the group itself is still invalid due to a mismatch.',
    },
    {
      thought: 'implementing cross-field validation requires a custom directive or a third-party library.',
      reality: 'a cross-field validator is just a plain function with the exact same ValidationErrors | null signature as a normal validator — the only difference is WHAT it is attached to (the group, via fb.group()\'s options) and WHAT it receives (the whole group, not one control).',
    },
  ];
}
