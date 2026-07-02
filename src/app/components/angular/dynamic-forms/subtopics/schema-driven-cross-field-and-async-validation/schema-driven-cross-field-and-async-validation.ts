import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-schema-driven-cross-field-and-async-validation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './schema-driven-cross-field-and-async-validation.html',
  styleUrl: './schema-driven-cross-field-and-async-validation.scss',
})
export class SchemaDrivenCrossFieldAndAsyncValidationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Expressing cross-field rules declaratively in the schema',
      points: [
        'The main topic\'s validators (<code>required</code>, <code>minLength</code>, <code>pattern</code>) are all SINGLE-FIELD scalars — a cross-field rule needs a DIFFERENT schema shape entirely, applied at the GROUP level: <code>crossFieldRules?: { type: \'match\'; fieldA: string; fieldB: string; message: string }[]</code> declared once on the top-level schema, not per-field.',
        'A generic <code>applyCrossFieldRules(form, rules)</code> function reads this array and attaches a matching Angular validator to the GROUP for each rule: <code>rule.type === \'match\' ? (g) =&gt; g.get(rule.fieldA)?.value === g.get(rule.fieldB)?.value ? null : { crossField: rule.message } : ...</code> — a small interpreter translating declarative rule OBJECTS into real <code>ValidatorFn</code>s.',
      ],
    },
    {
      heading: 'A registry pattern for async validators',
      points: [
        'Since a JSON schema cannot literally contain a JavaScript function, an <code>asyncValidator?: string</code> property on a field holds a NAME (e.g. <code>\'checkUsernameUnique\'</code>) that is looked up in a REGISTRY object mapping names to real <code>AsyncValidatorFn</code> implementations: <code>const ASYNC_VALIDATORS: Record&lt;string, () =&gt; AsyncValidatorFn&gt; = { checkUsernameUnique: () =&gt; (c) =&gt; ... }</code> — this keeps the schema itself fully JSON-serialisable while still wiring up real async logic.',
        'The registry is registered ONCE (typically via <code>inject()</code> in the form-building service, or passed as a parameter to <code>buildForm()</code>) — this is the SAME "plugin registry" pattern used for custom field renderers, applied here specifically to validation instead of rendering.',
      ],
    },
    {
      heading: 'Where validation state actually surfaces in a dynamic form',
      points: [
        'A cross-field error lives on the GROUP (<code>form.errors?.[\'crossField\']</code>), not on either individual field — the dynamic form\'s error-display template needs a SEPARATE section for group-level errors, distinct from the per-field error rendering that already exists for scalar validators.',
        'An async validator field shows <code>control.pending</code> while its check is in flight — since the schema drives which fields even HAVE an async validator, the template\'s pending-state UI (a small spinner next to the field) should conditionally render based on <code>field.asyncValidator</code> being set, not unconditionally for every field.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/form-builder.ts',
      content: `import { FormBuilder, FormGroup, Validators, ValidatorFn, AsyncValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { of, delay, map } from 'rxjs';

export interface FieldConfig {
  key: string;
  label: string;
  required?: boolean;
  asyncValidator?: string; // a NAME looked up in the registry — schema stays JSON-serialisable
}

export interface CrossFieldRule {
  type: 'match';
  fieldA: string;
  fieldB: string;
  message: string;
}

// Registry: schema references validators by NAME, real functions live here
const TAKEN_USERNAMES = ['admin', 'root'];
const ASYNC_VALIDATOR_REGISTRY: Record<string, () => AsyncValidatorFn> = {
  checkUsernameUnique: () => (control: AbstractControl) =>
    of(control.value).pipe(
      delay(500),
      map(value => (TAKEN_USERNAMES.includes(value) ? { taken: 'Username already taken' } : null)),
    ),
};

export function buildForm(fb: FormBuilder, schema: FieldConfig[], crossFieldRules: CrossFieldRule[]): FormGroup {
  const group: Record<string, any> = {};

  for (const field of schema) {
    const validators: ValidatorFn[] = field.required ? [Validators.required] : [];
    const asyncValidators: AsyncValidatorFn[] = field.asyncValidator
      ? [ASYNC_VALIDATOR_REGISTRY[field.asyncValidator]()]
      : [];
    group[field.key] = fb.control('', { validators, asyncValidators });
  }

  const form = fb.group(group);

  // Interpret declarative cross-field rules into real group-level validators
  const groupValidators: ValidatorFn[] = crossFieldRules.map(rule => (g: AbstractControl): ValidationErrors | null => {
    const a = g.get(rule.fieldA)?.value;
    const b = g.get(rule.fieldB)?.value;
    return a && b && a !== b ? { crossField: rule.message } : null;
  });
  form.setValidators(groupValidators);

  return form;
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { buildForm, FieldConfig, CrossFieldRule } from './form-builder';

const schema: FieldConfig[] = [
  { key: 'username', label: 'Username', required: true, asyncValidator: 'checkUsernameUnique' },
  { key: 'password', label: 'Password', required: true },
  { key: 'confirmPassword', label: 'Confirm Password', required: true },
];

const crossFieldRules: CrossFieldRule[] = [
  { type: 'match', fieldA: 'password', fieldB: 'confirmPassword', message: 'Passwords must match' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <h3>Schema-driven cross-field rule + registry-based async validator</h3>
    <form [formGroup]="form">
      <div>
        <input formControlName="username" placeholder="Username (try 'admin')" />
        @if (form.get('username')!.pending) {
          <span>Checking...</span>
        }
        @if (form.get('username')!.errors?.['taken']) {
          <p style="color: red;">{{ form.get('username')!.errors!['taken'] }}</p>
        }
      </div>
      <input formControlName="password" placeholder="Password" type="password" />
      <input formControlName="confirmPassword" placeholder="Confirm password" type="password" />

      @if (form.errors?.['crossField']) {
        <p style="color: red;">{{ form.errors!['crossField'] }}</p>
      }
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  form = buildForm(this.fb, schema, crossFieldRules);
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
  <head><title>Schema-driven cross-field and async validation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add "root" as a valid entry alongside "admin" in TAKEN_USERNAMES, and verify typing "root" also shows the "already taken" error after the pending check resolves.',
    hint: 'TAKEN_USERNAMES already includes both \'admin\' and \'root\' — verify by typing "root" into the username field and confirming the error appears after the 500ms delay.',
    solution: `// TAKEN_USERNAMES already includes ['admin', 'root'] — typing "root"
// should already trigger the "Username already taken" error after
// the simulated 500ms async check resolves.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a JSON schema can directly contain a reference to a real async validator function.',
      reality: 'JSON cannot serialize functions — the schema stores a NAME string (asyncValidator: "checkUsernameUnique") that is looked up in a real registry object mapping names to actual AsyncValidatorFn implementations.',
    },
    {
      thought: 'a cross-field validation error should be displayed near one of the two fields it compares.',
      reality: 'the error lives on the GROUP (form.errors), not on either individual field — the template needs a separate section specifically for group-level errors, distinct from per-field error rendering.',
    },
    {
      thought: 'the same scalar validator hints (required, minLength, pattern) used for single fields can also express cross-field rules with minor tweaks.',
      reality: 'cross-field rules need a genuinely different schema shape applied at the GROUP level (not per-field), interpreted by a separate function that attaches group-level validators rather than field-level ones.',
    },
  ];
}
