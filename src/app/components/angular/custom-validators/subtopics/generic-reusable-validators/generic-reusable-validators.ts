import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generic-reusable-validators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './generic-reusable-validators.html',
  styleUrl: './generic-reusable-validators.scss',
})
export class GenericReusableValidatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Generalizing a one-off cross-field validator into a reusable factory',
      points: [
        'The password-match validator on the main Custom Validators page is HARDCODED to two specific field names. A genuinely reusable version takes the field names as PARAMETERS: <code>matchFields(fieldA: string, fieldB: string, errorKey: string): ValidatorFn</code> — usable for password confirmation, email confirmation, or any two-field equality rule across the whole app.',
        'A higher-order VALIDATOR — a function that takes a condition and another validator, returning a new validator — lets you express "only apply this rule when X is true" WITHOUT writing a new one-off validator per condition: <code>conditionalValidator(predicate: (control) =&gt; boolean, validator: ValidatorFn): ValidatorFn</code>.',
      ],
    },
    {
      heading: 'Testing validators as pure functions — no TestBed, no DOM',
      points: [
        'Every <code>ValidatorFn</code> is a pure function of an <code>AbstractControl</code> — you can test it by passing a MINIMAL FAKE object with just a <code>value</code> property (and a <code>get()</code> method if it needs to reach sibling controls), with no <code>TestBed.configureTestingModule</code> or component fixture required at all.',
        'Fast, isolated tests: <code>expect(minWordsValidator(5)({ value: \'one two\' } as AbstractControl)).toEqual({ minWords: jasmine.any(String) })</code> and <code>expect(minWordsValidator(5)({ value: \'one two three four five\' } as AbstractControl)).toBeNull()</code> — both assertions run in milliseconds with zero Angular test infrastructure.',
        'For a cross-field validator under test, construct a fake group whose <code>get(name)</code> returns an object with the right <code>value</code> — you are testing the LOGIC of the validator, not Angular\'s form machinery, so the fake only needs to satisfy what the validator function actually reads.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/validators.ts',
      content: `import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Generic — works for ANY two fields, not just password/confirm
export function matchFields(fieldA: string, fieldB: string, errorKey = 'mismatch'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(fieldA)?.value;
    const b = group.get(fieldB)?.value;
    return a && b && a !== b ? { [errorKey]: \`\${fieldA} and \${fieldB} must match\` } : null;
  };
}

// Higher-order — wraps ANY validator, applying it only when the predicate is true
export function conditionalValidator(
  predicate: (control: AbstractControl) => boolean,
  validator: ValidatorFn,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    predicate(control) ? validator(control) : null;
}

// Example usage of conditionalValidator: only require 'reason' when 'status' is 'rejected'
export function requiredWhenRejected(): ValidatorFn {
  return conditionalValidator(
    (group) => group.get('status')?.value === 'rejected',
    (group) => (group.get('reason')?.value ? null : { reasonRequired: 'Reason is required when rejecting' }),
  );
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { matchFields, requiredWhenRejected } from './validators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <h3>Generic matchFields() — reused for email confirmation, not just passwords</h3>
    <form [formGroup]="emailForm">
      <input formControlName="email" placeholder="Email" />
      <input formControlName="confirmEmail" placeholder="Confirm email" />
      @if (emailForm.errors?.['mismatch']) {
        <p style="color: red;">{{ emailForm.errors!['mismatch'] }}</p>
      }
    </form>

    <h3>conditionalValidator — reason required only when status is "rejected"</h3>
    <form [formGroup]="reviewForm">
      <select formControlName="status">
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <input formControlName="reason" placeholder="Reason (required if rejected)" />
      @if (reviewForm.errors?.['reasonRequired']) {
        <p style="color: red;">{{ reviewForm.errors!['reasonRequired'] }}</p>
      }
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  emailForm = this.fb.group(
    { email: [''], confirmEmail: [''] },
    { validators: matchFields('email', 'confirmEmail', 'mismatch') },
  );

  reviewForm = this.fb.group(
    { status: ['approved'], reason: [''] },
    { validators: requiredWhenRejected() },
  );
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
  <head><title>Generic reusable validators</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a pure-function test (as a comment or in a new file) for matchFields that asserts it returns null when both fields have the same value "abc", using a minimal fake group object.',
    hint: 'const fakeGroup = { get: (name: string) => ({ value: \'abc\' }) } as any; expect(matchFields(\'a\', \'b\')(fakeGroup)).toBeNull();',
    solution: `const fakeGroup = {
  get: (name: string) => ({ value: 'abc' }),
} as any;

expect(matchFields('a', 'b')(fakeGroup)).toBeNull();`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a validator requires TestBed and a real reactive form to construct a valid AbstractControl.',
      reality: 'a ValidatorFn is a pure function — a minimal fake object with just the properties the validator actually reads (usually value, sometimes get()) is enough, with zero Angular test infrastructure needed.',
    },
    {
      thought: 'conditionalValidator and a group validator with an if-check inside its body are functionally identical approaches.',
      reality: 'conditionalValidator is a reusable HIGHER-ORDER function that wraps any validator with any predicate — it eliminates writing a new one-off validator per condition, whereas an inline if-check only solves that one specific case.',
    },
    {
      thought: 'a validator written for one specific pair of field names (like password/confirm) is inherently a one-off — reuse means copy-pasting and renaming.',
      reality: 'parameterizing the field names as arguments (matchFields(fieldA, fieldB, errorKey)) turns the exact same logic into a genuinely reusable factory usable for any two-field equality rule across the app.',
    },
  ];
}
