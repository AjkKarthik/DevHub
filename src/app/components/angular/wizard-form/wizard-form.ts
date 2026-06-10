import { Component, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { JsonPipe } from '@angular/common';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-wizard-form',
  imports: [ReactiveFormsModule, CodeBlockComponent, TheoryBlockComponent, JsonPipe, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './wizard-form.html',
  styleUrl: './wizard-form.scss',
})
export class WizardFormDemo {
  private fb = new FormBuilder();

  qna: QnaItem[] = [
    { q: 'Why use separate FormGroups per step instead of one big FormGroup?', a: 'Per-step groups let you validate each step independently. Calling <code>step0.markAllAsTouched()</code> and checking <code>step0.invalid</code> only validates that step\'s fields — you don\'t expose errors on future steps the user hasn\'t filled yet.' },
    { q: 'How do you advance to the next step only if the current step is valid?', a: '<code>this.currentForm()?.markAllAsTouched(); if (this.currentForm()?.invalid) return; this.step.update(s => s + 1);</code>. <code>markAllAsTouched()</code> reveals all errors; return early if invalid.' },
    { q: 'Should you validate on Back navigation?', a: 'No — back navigation should always succeed. Users must be able to move backward freely to correct earlier answers. Only validate on Next/Submit.' },
    { q: 'How do you collect all step values for final submission?', a: 'Spread all step FormGroup values: <code>const data = { ...this.step0.value, ...this.step1.value, ...this.step2.value }</code>. Or use a parent FormGroup with <code>addControl()</code> per step.' },
    { q: 'How do you save wizard progress across a page refresh?', a: 'Subscribe to each step\'s <code>valueChanges</code> and write to localStorage. On init, call <code>step0.patchValue(JSON.parse(localStorage.getItem(\'step0\') ?? \'{}\'))</code> to restore.' },
    { q: 'How do you implement a step indicator (stepper UI)?', a: 'Iterate the steps array with <code>@for</code>. Compare the index to <code>step()</code>: <code>[class.active]="i === step()"</code>, <code>[class.done]="i &lt; step()"</code>. Add a connector line between circles to complete the visual stepper.' },
  ];

  step      = signal(0);
  submitted = signal(false);

  steps = [
    { label: 'Personal',  icon: '👤' },
    { label: 'Account',   icon: '🔑' },
    { label: 'Preferences', icon: '⚙️' },
    { label: 'Review',    icon: '✅' },
  ];

  step0 = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    dob:       ['', Validators.required],
  });

  step1 = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  step2 = this.fb.group({
    theme:         ['light'],
    notifications: [true],
    language:      ['en'],
  });

  currentForm = computed(() => [this.step0, this.step1, this.step2][this.step()] ?? null);

  next() {
    const form = this.currentForm();
    if (form) { form.markAllAsTouched(); if (form.invalid) return; }
    this.step.update(s => Math.min(s + 1, this.steps.length - 1));
  }

  back() { this.step.update(s => Math.max(s - 1, 0)); }

  submit() {
    this.submitted.set(true);
  }

  get allValues() {
    return { ...this.step0.value, ...this.step1.value, ...this.step2.value };
  }

  isStepValid(i: number) {
    return [this.step0, this.step1, this.step2][i]?.valid ?? true;
  }

  theory: TheoryPoint[] = [
    {
      heading: 'Multi-step wizard pattern',
      points: [
        'Split a long form into named steps — each step has its own FormGroup validated independently.',
        'Track current step with a signal — only the active step\'s FormGroup is shown and validated.',
        'Call markAllAsTouched() + check invalid before advancing — user sees errors without submitting.',
        'Only call the final submit() after all steps pass — collect all FormGroup values with spread.',
      ],
    },
    {
      heading: 'Navigation & state',
      points: [
        'Back navigation never validates — users should freely move backward without losing data.',
        'Show a stepper UI with completed/active/future states so users know where they are.',
        'Persist form values across navigation with signal or service — data survives route change if needed.',
        'Use routerLink per step for deep-linkable wizards — pass step index as a query param.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Do NOT use one giant FormGroup for a wizard — per-step groups make partial validation easy.',
        'Cross-step validation (e.g. confirm email matches step 1 value) needs a group-level validator on the parent.',
        'Disable the Next button during async validation (e.g. username check) to prevent premature advancement.',
        'Save progress to localStorage on every step change for resilience against page refresh.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Step structure',
      language: 'typescript',
      code: `export class WizardComponent {
  step = signal(0);

  // One FormGroup per step
  step0 = this.fb.group({ firstName: ['', Validators.required], ... });
  step1 = this.fb.group({ email: ['', [Validators.required, Validators.email]], ... });

  // Map step index to form
  currentForm = computed(() => [this.step0, this.step1][this.step()] ?? null);

  next() {
    const form = this.currentForm();
    if (form) {
      form.markAllAsTouched();
      if (form.invalid) return;   // ← stop if current step is invalid
    }
    this.step.update(s => s + 1);
  }

  submit() {
    // Merge all step values
    const data = { ...this.step0.value, ...this.step1.value };
    this.api.save(data).subscribe();
  }
}`,
    },
    {
      label: 'Stepper template',
      language: 'html',
      code: `<!-- Progress indicator -->
<div class="stepper">
  @for (s of steps; track s.label; let i = $index) {
    <div class="step-dot"
      [class.done]="i < step()"
      [class.active]="i === step()">
      {{ i < step() ? '✓' : i + 1 }}
    </div>
  }
</div>

<!-- Step content -->
@switch (step()) {
  @case (0) {
    <div [formGroup]="step0">
      <input formControlName="firstName" />
    </div>
  }
  @case (1) { ... }
}

<!-- Navigation -->
<button (click)="back()" [disabled]="step() === 0">Back</button>
<button (click)="next()" *ngIf="step() < lastStep">Next</button>
<button (click)="submit()" *ngIf="step() === lastStep">Submit</button>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'In the WizardFormDemo component, what does the `currentForm` computed signal return when the step index is 3 (the Review step)?', options: ['It returns step2 (the last data-entry FormGroup)', 'It returns null because index 3 is out of the array bounds', 'It throws a runtime error', 'It returns a merged FormGroup of all steps'], answer: 1, explanation: 'The computed is defined as `[this.step0, this.step1, this.step2][this.step()] ?? null`. The array has indices 0-2, so index 3 is undefined and the nullish coalescing operator returns null.' },
    { q: 'Why does the `back()` method NOT call `markAllAsTouched()` or check `form.invalid` before decrementing the step?', options: ['Because back() navigates to a completed step where validation already passed', 'Because Angular automatically validates on every navigation event', 'Because users must be free to move backward without being blocked by validation errors', 'Because FormGroups on previous steps are destroyed when navigating forward'], answer: 2, explanation: 'Back navigation should always succeed. Blocking backward movement would trap users who need to correct earlier data. Only forward navigation (Next/Submit) enforces validation.' },
    { q: 'What is the purpose of calling `form.markAllAsTouched()` inside the `next()` method before checking `form.invalid`?', options: ['It submits the form to the server immediately', 'It resets all field values to their initial state', 'It forces Angular to re-render the entire component tree', 'It reveals validation error messages for all fields the user may not have interacted with yet'], answer: 3, explanation: 'Angular only shows validation errors on touched controls by default. `markAllAsTouched()` marks every control as touched so error messages become visible even if the user skipped over a field.' },
    { q: 'In the template, how does the stepper connector line between step dots indicate that a step has been completed?', options: ['[class.done]="step() >= i"', '[class.done]="step() > i"', '[class.done]="step() === i"', '[class.done]="isStepValid(i)"'], answer: 1, explanation: 'The template uses `[class.done]="step() > i"` on both the `.step-item` and the `.step-connector`. A connector after step i is marked done when the current step index is strictly greater than i, meaning the user has moved past that step.' },
    { q: 'How does the `allValues` getter collect the final form data across all three steps for display on the Review screen?', options: ['It calls `this.fb.group()` to merge all controls into one new FormGroup', 'It uses `Object.assign` on each FormGroup\'s `controls` property', 'It spreads all three step FormGroup `.value` objects into a single plain object', 'It reads values from the DOM using `document.querySelector`'], answer: 2, explanation: '`get allValues() { return { ...this.step0.value, ...this.step1.value, ...this.step2.value }; }` spreads each FormGroup\'s value snapshot into one flat object — a standard pattern for collecting data across wizard steps.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormBuilder.group()', type: 'function', desc: 'Creates a FormGroup from a config object, optionally accepting group-level validators as a second argument.' , since: '2'},
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive signal; used here to track the current wizard step index.' , since: '16'},
    { name: 'computed()', type: 'function', desc: 'Derives a read-only signal from other signals; used to map the step index to the active FormGroup.' , since: '16'},
    { name: 'markAllAsTouched()', type: 'function', desc: 'Marks every control in a FormGroup as touched, making Angular display validation errors for fields the user never interacted with.' },
    { name: 'ReactiveFormsModule', type: 'class', desc: 'Module that provides directives like formGroup and formControlName required to bind template elements to reactive form controls.' , since: '2'},
    { name: 'Validators', type: 'class', desc: 'Static collection of built-in validator functions (required, email, minLength, etc.) composable into FormControl or FormGroup definitions.' , since: '2'},
    { name: 'AbstractControl', type: 'class', desc: 'Base class for FormControl, FormGroup, and FormArray; used as the parameter type for custom validator functions.' , since: '2'},
    { name: 'ValidationErrors', type: 'interface', desc: 'Type alias for the object a validator returns on failure (e.g. { passwordMismatch: true }) or null on success.' , since: '2'},
    { name: '@switch / @case', type: 'directive', desc: 'Angular 17 built-in control flow block that conditionally renders step content based on the current step signal value.' , since: '17'},
    { name: 'signal.update()', type: 'function', desc: 'Updates a signal\'s value using a function of its current value; used to increment or decrement the step index safely.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Step tracking: boolean flags vs signal()', before: '// Old: manual boolean array\ncurrentStep = 0;\nsteps = [false, false, false];\nnext() { this.currentStep++; }\nback() { this.currentStep--; }', after: '// New: single signal with update()\nstep = signal(0);\nnext() { this.step.update(s => Math.min(s + 1, this.steps.length - 1)); }\nback() { this.step.update(s => Math.max(s - 1, 0)); }',
      note: 'Signals replace imperative state with reactive, composable values. update() guarantees the new value is computed from the latest state.' },
    { title: 'Active form selection: switch statement vs computed()', before: '// Old: imperative getter\nget currentForm() {\n  if (this.step === 0) return this.step0;\n  if (this.step === 1) return this.step1;\n  return null;\n}', after: '// New: derived signal\ncurrentForm = computed(\n  () => [this.step0, this.step1, this.step2][this.step()] ?? null\n);',
      note: 'computed() automatically re-evaluates whenever step() changes, eliminating manual cache invalidation.' },
    { title: 'Template step switching: *ngSwitch vs @switch', before: '<!-- Old: structural directive -->\n<ng-container [ngSwitch]="step">\n  <div *ngSwitchCase="0" [formGroup]="step0">...</div>\n  <div *ngSwitchCase="1" [formGroup]="step1">...</div>\n</ng-container>', after: '<!-- New: built-in control flow -->\n@switch (step()) {\n  @case (0) { <div [formGroup]="step0">...</div> }\n  @case (1) { <div [formGroup]="step1">...</div> }\n}',
      note: '@switch (Angular 17+) needs no module import and has better tree-shaking than the NgSwitch directive.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Validating on Back navigation', wrong: 'back() {\n  this.currentForm()?.markAllAsTouched();\n  if (this.currentForm()?.invalid) return; // blocks going back!\n  this.step.update(s => s - 1);\n}', right: 'back() {\n  // Never validate going backward\n  this.step.update(s => Math.max(s - 1, 0));\n}', explanation: 'Blocking backward navigation traps users who need to fix earlier steps. Only Next and Submit should enforce validation.'  },
    { title: 'Using one giant FormGroup for all steps', wrong: '// Single group means all errors surface at once\nform = this.fb.group({\n  firstName: [\'\', Validators.required],\n  email: [\'\', Validators.required],\n  password: [\'\', Validators.required],\n});', right: '// Per-step groups allow independent validation\nstep0 = this.fb.group({ firstName: [\'\', Validators.required] });\nstep1 = this.fb.group({ email: [\'\', Validators.required] });\nstep2 = this.fb.group({ password: [\'\', Validators.required] });', explanation: 'A single FormGroup exposes all errors simultaneously. Per-step groups let you call markAllAsTouched() on only the current step.'  },
    { title: 'Forgetting markAllAsTouched() before checking invalid', wrong: 'next() {\n  if (this.currentForm()?.invalid) return; // errors never shown!\n  this.step.update(s => s + 1);\n}', right: 'next() {\n  const form = this.currentForm();\n  if (form) { form.markAllAsTouched(); if (form.invalid) return; }\n  this.step.update(s => s + 1);\n}', explanation: 'Angular only renders validation messages for touched controls. Without markAllAsTouched(), skipped fields silently block progress with no visible error.'  },
    { title: 'Placing cross-step validators on a child control instead of the group', wrong: '// Control-level validator cannot read sibling controls\npassword: [\'\', [Validators.required, passwordMatchValidator]]', right: '// Group-level validator receives the whole FormGroup\nstep1 = this.fb.group(\n  { password: [\'\'], confirmPassword: [\'\'] },\n  { validators: passwordMatchValidator }\n);', explanation: 'A control validator only receives that control\'s value. Cross-field rules (e.g., password confirmation) need a group-level validator so both fields are accessible.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'Signals-based wizard state', features: ['signal() replaces component properties for step tracking — changes are automatically propagated to the template', 'computed() derives the active FormGroup from the step signal without manual getter invalidation', 'signal.update() applies a pure function to current value, preventing off-by-one race conditions in next()/back()'] },
    { version: '17', label: '@switch / @case control flow', features: ['@switch (step()) replaces [ngSwitch] and *ngSwitchCase — no NgSwitch import needed', '@for with $index replaces *ngFor for the stepper progress indicator', 'Built-in control flow blocks improve bundle size and compile-time checking'] },
  ];

  challenge: Challenge = {
    title: 'Add a \'Confirm Password\' field with cross-field validation',
    description: 'Extend the Account Setup step (step1) of the wizard to include a `confirmPassword` field. Add a custom group-level validator that checks whether `password` and `confirmPassword` match. Display an error message under the confirm field when they do not match. The Next button should remain blocked until passwords match.',
    language: 'typescript',
    hints: [
      'Use a group-level validator by passing a second argument to `this.fb.group({ ... }, { validators: myValidator })` — group validators receive the entire AbstractControl (the FormGroup) as their argument.',
      'A validator function returns null when valid, or an error object like `{ passwordMismatch: true }` when invalid. Access individual controls with `group.get(\'password\')?.value`.',
      'In the template, check the group error with `step1.hasError(\'passwordMismatch\')` and combine it with the touched state of the confirmPassword control to avoid showing the error prematurely.',
      'The existing `next()` method already calls `form.markAllAsTouched()` and returns early if `form.invalid`, so no changes to navigation logic are needed — group-level errors make the form invalid automatically.',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// TODO 1: Write a standalone validator function called passwordMatchValidator.
// It should accept an AbstractControl (the FormGroup),
// cast it, read the 'password' and 'confirmPassword' values,
// and return { passwordMismatch: true } when they differ, or null when they match.

// passwordMatchValidator goes here

@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="step1" class="step-form">
      <h3>Account Setup</h3>

      <div class="field">
        <label>Username</label>
        <input formControlName="username" />
      </div>

      <div class="field">
        <label>Email</label>
        <input type="email" formControlName="email" />
      </div>

      <div class="field">
        <label>Password</label>
        <input type="password" formControlName="password" />
      </div>

      <!-- TODO 3: Add a 'Confirm Password' input bound to formControlName="confirmPassword" -->
      <!-- TODO 4: Below the input, show an error paragraph when step1 has the 'passwordMismatch'
                   error AND the confirmPassword control has been touched. -->

      <button type="button" (click)="next()">Next</button>
    </form>
  \`,
})
export class AccountStepDemo {
  private fb = new FormBuilder();

  // TODO 2: Add 'confirmPassword' control (required, minLength 8) to this group,
  // and pass passwordMatchValidator as a group-level validator.
  step1 = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  next() {
    this.step1.markAllAsTouched();
    if (this.step1.invalid) {
      console.log('Step invalid — fix errors before continuing');
      return;
    }
    console.log('Step valid — advancing', this.step1.value);
  }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// Group-level validator: receives the FormGroup as the control argument
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="step1" class="step-form">
      <h3>Account Setup</h3>

      <div class="field">
        <label>Username</label>
        <input formControlName="username" />
      </div>

      <div class="field">
        <label>Email</label>
        <input type="email" formControlName="email" />
      </div>

      <div class="field">
        <label>Password</label>
        <input type="password" formControlName="password" />
      </div>

      <div class="field">
        <label>Confirm Password</label>
        <input type="password" formControlName="confirmPassword" />
        @if (step1.hasError('passwordMismatch') && step1.get('confirmPassword')?.touched) {
          <p class="error">Passwords do not match.</p>
        }
      </div>

      <button type="button" (click)="next()">Next</button>
    </form>
  \`,
})
export class AccountStepDemo {
  private fb = new FormBuilder();

  step1 = this.fb.group(
    {
      username:        ['', [Validators.required, Validators.minLength(3)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    },
    { validators: passwordMatchValidator }
  );

  next() {
    this.step1.markAllAsTouched();
    if (this.step1.invalid) {
      console.log('Step invalid — fix errors before continuing');
      return;
    }
    console.log('Step valid — advancing', this.step1.value);
  }
}`,
  };
}
