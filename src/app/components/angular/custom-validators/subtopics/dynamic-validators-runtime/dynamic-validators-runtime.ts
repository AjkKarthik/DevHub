import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dynamic-validators-runtime-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dynamic-validators-runtime.html',
  styleUrl: './dynamic-validators-runtime.scss',
})
export class DynamicValidatorsRuntimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'setValidators, addValidators, removeValidators',
      points: [
        '<code>control.setValidators(fn)</code> REPLACES whatever validators the control currently has with the new set — pass an array to set multiple, or <code>null</code> to clear all validators entirely. This is a full replacement, not an addition.',
        '<code>control.addValidators(fn)</code> and <code>control.removeValidators(fn)</code> (Angular 12+) add or remove a SPECIFIC validator without disturbing any others already on the control — the correct tool for toggling one conditional rule on and off without accidentally wiping out <code>Validators.required</code> or other pre-existing rules.',
        'The SAME function reference must be passed to both <code>addValidators</code> and the later <code>removeValidators</code> call for the removal to actually match — a validator factory called twice (<code>minLength(5)</code> then <code>minLength(5)</code> again) produces two DIFFERENT function instances that Angular cannot match against each other for removal purposes.',
      ],
    },
    {
      heading: 'updateValueAndValidity — the step that is easy to forget',
      points: [
        'None of <code>setValidators</code>/<code>addValidators</code>/<code>removeValidators</code> RE-RUN validation immediately — they only change which validators are registered. You must call <code>control.updateValueAndValidity()</code> afterward to actually re-evaluate the control\'s current value against the new validator set.',
        'Forgetting <code>updateValueAndValidity()</code> is the single most common bug in dynamic-validator code — the control\'s <code>errors</code>/<code>valid</code> state silently stays stale (reflecting the OLD validator set) until the next unrelated value change happens to trigger a re-check.',
        'Pass <code>{ emitEvent: false }</code> to <code>updateValueAndValidity({ emitEvent: false })</code> when you are updating validators from WITHIN a <code>valueChanges</code> subscription on a sibling/parent control — otherwise you can trigger an infinite loop of value-change notifications feeding back into each other.',
      ],
    },
    {
      heading: 'A practical conditional-required pattern',
      points: [
        'A common real-world need: field B is required ONLY when field A has a specific value (e.g. "shipping address" fields only required when "ship to different address" is checked). Subscribe to field A\'s <code>valueChanges</code>, and call <code>addValidators</code>/<code>removeValidators</code> on field B\'s control accordingly, followed by <code>updateValueAndValidity()</code>.',
        'This pattern is genuinely different from a static cross-field GROUP validator (covered on the main Custom Validators page) — a group validator runs on every change and reports errors on the group, while dynamic validators actually change WHICH RULES APPLY to a specific control, visible directly on that control\'s own <code>errors</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <h3>Conditionally required field via addValidators/removeValidators</h3>
    <form [formGroup]="form">
      <label>
        <input type="checkbox" formControlName="shipDifferent" />
        Ship to a different address
      </label>

      <div>
        <label>Shipping address {{ form.get('shippingAddress')!.hasValidator(requiredFn) ? '(required)' : '(optional)' }}</label>
        <input formControlName="shippingAddress" />
        @if (form.get('shippingAddress')!.touched && form.get('shippingAddress')!.errors?.['required']) {
          <p style="color: red;">Shipping address is required.</p>
        }
      </div>
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  readonly requiredFn = Validators.required;

  form = this.fb.group({
    shipDifferent: [false],
    shippingAddress: [''],
  });

  constructor() {
    const addressCtrl = this.form.get('shippingAddress')!;

    this.form.get('shipDifferent')!.valueChanges.subscribe(checked => {
      if (checked) {
        addressCtrl.addValidators(Validators.required);
      } else {
        addressCtrl.removeValidators(Validators.required);
      }
      // Without this call, the control's valid/errors state stays stale
      addressCtrl.updateValueAndValidity();
      addressCtrl.markAsTouched();
    });
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
  <head><title>Dynamic validators at runtime</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a Validators.minLength(5) rule that is also added/removed alongside Validators.required, so the shipping address must be at least 5 characters when required.',
    hint: 'Call addValidators([Validators.required, Validators.minLength(5)]) and removeValidators([Validators.required, Validators.minLength(5)]) — both methods accept an array of validators, not just a single one.',
    solution: `this.form.get('shipDifferent')!.valueChanges.subscribe(checked => {
  const rules = [Validators.required, Validators.minLength(5)];
  if (checked) {
    addressCtrl.addValidators(rules);
  } else {
    addressCtrl.removeValidators(rules);
  }
  addressCtrl.updateValueAndValidity();
  addressCtrl.markAsTouched();
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling addValidators() or removeValidators() immediately re-evaluates the control and updates its errors.',
      reality: 'none of setValidators/addValidators/removeValidators re-run validation by themselves — you must call updateValueAndValidity() afterward, or the control\'s valid/errors state stays stale.',
    },
    {
      thought: 'calling minLength(5) twice and passing both results to addValidators/removeValidators will correctly add-then-remove the same rule.',
      reality: 'each call to a validator factory like minLength(5) produces a genuinely DIFFERENT function instance — removeValidators can only remove a validator by the SAME function reference that was added, so you must store and reuse that exact reference.',
    },
    {
      thought: 'dynamic per-control validators (addValidators/removeValidators) and a static group-level cross-field validator solve the same problem, just with different syntax.',
      reality: 'they solve genuinely different problems — a group validator runs the SAME rule on every change and reports on the group, while dynamic validators change WHICH RULES apply to a specific control over time, with errors visible directly on that control.',
    },
  ];
}
