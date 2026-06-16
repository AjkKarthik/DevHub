import { Component, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  selector: 'app-wizard-form',
  imports: [
    ReactiveFormsModule, JsonPipe,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './wizard-form.html',
  styleUrl: './wizard-form.scss',
})
export class WizardFormDemo {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Forms (Reactive & Template)', route: '/angular/forms-demo' },
    { label: 'Custom Validators', route: '/angular/custom-validators' },
  ];

  step      = signal(0);
  submitted = signal(false);

  steps = [
    { label: 'Personal',     icon: '👤' },
    { label: 'Account',      icon: '🔑' },
    { label: 'Preferences',  icon: '⚙️' },
    { label: 'Review',       icon: '✅' },
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

  submit() { this.submitted.set(true); }

  get allValues() {
    return { ...this.step0.value, ...this.step1.value, ...this.step2.value };
  }

  isStepValid(i: number) {
    return [this.step0, this.step1, this.step2][i]?.valid ?? true;
  }

  theory: TheoryPoint[] = [
    {
      heading: 'Why multi-step wizard forms?',
      points: [
        'Complex forms with 10+ fields overwhelm users — breaking them into 3–5 named steps reduces cognitive load and significantly improves completion rates in onboarding, checkout, and survey flows.',
        'Steps create natural validation checkpoints: each step validates only its own fields before advancing, giving focused error messages instead of a wall of errors for an entire long form.',
        'Business logic often requires sequential data collection — account type before plan selection, shipping address before payment. Wizards enforce this order at the UI level.',
        'Multi-step forms are common in production apps (registration, checkout, application forms). Angular\'s signal-based reactive pattern maps naturally to this interaction model.',
        'Optionally deep-linkable: each step can correspond to a route segment or query param, enabling the browser back button and shareable links to a specific wizard step.',
      ],
    },
    {
      heading: 'Per-step FormGroup architecture',
      points: [
        'Create one <code>FormGroup</code> per step using <code>fb.group({})</code> — each step form is an independent reactive unit that can be validated, reset, and read independently without affecting other steps.',
        'Map the current step index to the active <code>FormGroup</code> with a <code>computed()</code> signal: <code>currentForm = computed(() => [step0, step1, step2][this.step()] ?? null)</code>. This is reactive — re-evaluates automatically when <code>step()</code> changes.',
        'Keep step forms as class fields initialised at declaration level: <code>step0 = this.fb.group({...})</code>. Do NOT create them inside <code>ngOnInit</code> or on each navigation — they persist across back/next and retain user input.',
        'For fields with multiple validators, use the array shorthand: <code>[initialValue, [Validators.required, Validators.minLength(8)]]</code>.',
        'Collect the final payload by spreading all step values: <code>&#123; ...step0.value, ...step1.value, ...step2.value &#125;</code>. Ensure no overlapping keys across steps — duplicates silently overwrite each other.',
      ],
    },
    {
      heading: 'Navigation logic — next / back / submit',
      points: [
        '<code>next()</code> always calls <code>form.markAllAsTouched()</code> first, then returns early if <code>form.invalid</code>. This reveals hidden validation errors on fields the user skipped without actually advancing.',
        '<code>back()</code> never validates — always decrement the step unconditionally. Users must be able to move backward freely to correct earlier answers; blocking them creates a frustrating trap.',
        'Clamp the step index to safe bounds: <code>this.step.update(s => Math.min(s + 1, maxStep))</code> and <code>Math.max(s - 1, 0)</code> prevent going below 0 or rendering an out-of-bounds <code>@switch</code> case.',
        'The submit action should only appear on the final review step, not as a Next button. Use <code>@if (step() &lt; lastIndex)</code> to swap between a Next and a Submit button in the wizard navigation bar.',
        'On final submit, re-validate all steps: <code>if ([step0, step1, step2].some(f => f.invalid)) return</code>. This guards against edge cases where a user navigated back, broke a previous step, then jumped forward.',
      ],
    },
    {
      heading: 'Stepper UI with signals',
      points: [
        'Render a progress indicator with <code>@for (s of steps; track s.label; let i = $index)</code>. Apply <code>[class.active]="step() === i"</code> for the current step and <code>[class.done]="step() &gt; i"</code> for completed steps.',
        'Place a connector line between step dots with <code>@if (!$last) &#123; &lt;div class="connector" [class.done]="step() &gt; i"&gt;&lt;/div&gt; &#125;</code>. The connector is "done" when the active step index has passed that position.',
        'Signal-based step tracking: <code>step = signal(0)</code> automatically triggers Angular\'s change-detection when updated — no manual <code>ChangeDetectorRef.markForCheck()</code> needed, even with <code>OnPush</code>.',
        'Show a checkmark in completed step circles: <code>&#123;&#123; step() &gt; i ? \'✓\' : s.icon &#125;&#125;</code>. This gives users clear visual feedback that a step has been completed and validated.',
        'The <code>isStepValid(i)</code> helper lets the stepper highlight invalid past steps: <code>return [step0, step1, step2][i]?.valid ?? true</code> — useful for showing a warning badge on a completed step the user later invalidated by going back.',
      ],
    },
    {
      heading: 'Cross-step validation and persistence',
      points: [
        'Cross-field validators within a step belong on the group: <code>fb.group(&#123; ... &#125;, &#123; validators: matchValidator &#125;)</code>. The validator receives the <code>FormGroup</code> as its argument and can read any sibling control value.',
        'Cross-step validation (e.g., email domain matching a previous step) requires a parent <code>FormGroup</code>: <code>parent.addControl(\'step0\', step0)</code>. A parent-level validator then has access to all sub-group values simultaneously.',
        'Persist form values across route navigation by saving each step\'s <code>valueChanges</code> to localStorage or a service: <code>step0.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => localStorage.setItem(\'wiz-step0\', JSON.stringify(v)))</code>.',
        'Restore saved values on init with <code>patchValue()</code>: <code>step0.patchValue(JSON.parse(localStorage.getItem(\'wiz-step0\') ?? \'null\') ?? &#123;&#125;)</code>. <code>patchValue</code> only updates keys present in the saved object, leaving others at their defaults.',
        'For async validation in a wizard (e.g., username availability), guard the Next button with both: <code>[disabled]="step0.pending || step0.invalid"</code>. A control in <code>PENDING</code> state is not yet <code>VALID</code> — advancing early submits an unresolved state.',
      ],
    },
    {
      heading: 'Best practices',
      points: [
        'Always add a final review step showing all collected values before submission — it reduces errors, builds user confidence, and reduces support requests from users who submitted incorrect data.',
        'Show error count badges on completed steps (e.g., "Step 2 ✕ 1 error") when users navigate back and make changes that invalidate a previous step — keeps global form state visible.',
        'For route-based wizards, store the step index in a query param (<code>/register?step=2</code>) and read it from <code>ActivatedRoute</code> on init. This makes the wizard deep-linkable and browser-back-aware without custom logic.',
        'Consider Angular CDK Stepper (<code>CdkStepper</code>) for complex wizards — it handles step validation state, linear vs non-linear navigation, keyboard accessibility, and step completion state out of the box.',
        'Test each step\'s <code>FormGroup</code> in isolation with <code>inject(FormBuilder)</code> in a test spec — no component fixture needed. Set values, trigger validation, and assert on <code>.valid</code> and <code>.errors</code> directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Step structure',
      language: 'typescript',
      code: `@Component({ selector: 'app-wizard', imports: [ReactiveFormsModule], ... })
export class WizardComponent {
  private fb = inject(FormBuilder);

  step = signal(0);

  // One FormGroup per step — independent, not nested
  step0 = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
  });

  step1 = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  // computed() re-evaluates whenever step() changes
  currentForm = computed(() => [this.step0, this.step1][this.step()] ?? null);

  next() {
    const form = this.currentForm();
    if (form) {
      form.markAllAsTouched();  // reveal errors on skipped fields
      if (form.invalid) return; // stop if current step is invalid
    }
    this.step.update(s => Math.min(s + 1, 2)); // clamp to last step
  }

  back() {
    // NEVER validate going back — always allow
    this.step.update(s => Math.max(s - 1, 0));
  }

  submit() {
    // Spread all step values into one payload
    const payload = { ...this.step0.value, ...this.step1.value };
    console.log('Submitting:', payload);
  }
}`,
    },
    {
      label: 'Stepper template',
      language: 'html',
      code: `<!-- Progress indicator with connector lines -->
<div class="stepper">
  @for (s of steps; track s.label; let i = $index) {
    <div class="step-item"
         [class.active]="step() === i"
         [class.done]="step() > i">
      <div class="step-circle">
        {{ step() > i ? '✓' : s.icon }}
      </div>
      <span class="step-label">{{ s.label }}</span>
    </div>
    @if (!$last) {
      <div class="step-connector" [class.done]="step() > i"></div>
    }
  }
</div>

<!-- Step content: only the active step's form is rendered -->
@switch (step()) {
  @case (0) {
    <form [formGroup]="step0" class="step-form">
      <input formControlName="firstName" placeholder="First name" />
    </form>
  }
  @case (1) {
    <form [formGroup]="step1" class="step-form">
      <input type="email" formControlName="email" placeholder="Email" />
    </form>
  }
  @case (2) {
    <div class="review">
      <pre>{{ allValues | json }}</pre>
    </div>
  }
}

<!-- Navigation bar -->
<div class="wizard-nav">
  <button (click)="back()" [disabled]="step() === 0">← Back</button>
  @if (step() < 2) {
    <button (click)="next()">Next →</button>
  } @else {
    <button (click)="submit()" class="btn-success">Submit</button>
  }
</div>`,
    },
    {
      label: 'Persist to localStorage',
      language: 'typescript',
      code: `import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({ selector: 'app-wizard', imports: [ReactiveFormsModule], ... })
export class PersistentWizardComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  step  = signal(0);
  step0 = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
  });

  ngOnInit() {
    // Restore saved values on mount
    const saved = this.loadSaved('wiz-step0');
    if (saved) this.step0.patchValue(saved); // patchValue: only sets present keys

    // Save on every change
    this.step0.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v =>
        localStorage.setItem('wiz-step0', JSON.stringify(v))
      );
  }

  // Restore the saved step index too (optional)
  ngOnInit2() {
    const savedStep = Number(localStorage.getItem('wiz-step') ?? '0');
    this.step.set(Math.min(savedStep, this.steps.length - 1));
  }

  clearSaved() {
    ['wiz-step0', 'wiz-step1', 'wiz-step'].forEach(k =>
      localStorage.removeItem(k)
    );
  }

  private loadSaved(key: string): Record<string, unknown> | null {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
    catch { return null; }
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does `currentForm` return when `step()` is 3 (the Review step index)?',
      options: [
        'step2 — the last data-entry FormGroup',
        'null — index 3 is out of the [step0, step1, step2] array bounds',
        'A runtime error is thrown',
        'A merged FormGroup of all steps',
      ],
      answer: 1,
      explanation: 'The computed is defined as `[this.step0, this.step1, this.step2][this.step()] ?? null`. The array has indices 0–2, so index 3 is `undefined` and the nullish coalescing operator returns `null`.',
    },
    {
      q: 'Why does `back()` NOT call `markAllAsTouched()` or check `form.invalid` before decrementing the step?',
      options: [
        'Because back() navigates to a completed step where validation already passed',
        'Because Angular automatically validates on every navigation event',
        'Because users must be free to move backward without being blocked by validation errors',
        'Because FormGroups on previous steps are destroyed when navigating forward',
      ],
      answer: 2,
      explanation: 'Back navigation should always succeed. Blocking backward movement would trap users who need to correct earlier data. Only forward navigation (Next/Submit) enforces validation.',
    },
    {
      q: 'What is the purpose of calling `form.markAllAsTouched()` inside `next()` before checking `form.invalid`?',
      options: [
        'It submits the form to the server immediately',
        'It resets all field values to their initial state',
        'It forces Angular to re-render the entire component tree',
        'It reveals validation error messages for fields the user may not have interacted with',
      ],
      answer: 3,
      explanation: 'Angular only shows validation errors on touched controls by default. `markAllAsTouched()` marks every control in the FormGroup as touched so all error messages become visible, even for fields the user skipped without interaction.',
    },
    {
      q: 'In the template, how is the `.done` class applied to a step connector line?',
      options: [
        '[class.done]="step() >= i"',
        '[class.done]="step() > i"',
        '[class.done]="step() === i"',
        '[class.done]="isStepValid(i)"',
      ],
      answer: 1,
      explanation: 'The template uses `[class.done]="step() > i"` on both the `.step-item` and the `.step-connector`. A connector after step i is marked done when the active step index is strictly greater than i, meaning the user has moved past that step.',
    },
    {
      q: 'How does `allValues` collect the final payload across all three steps?',
      options: [
        'It calls `fb.group()` to merge all controls into a new FormGroup',
        'It uses `Object.assign` on each FormGroup\'s `.controls` property',
        'It spreads all three step FormGroup `.value` objects into one plain object',
        'It reads values from the DOM using `document.querySelector`',
      ],
      answer: 2,
      explanation: '`get allValues() { return { ...this.step0.value, ...this.step1.value, ...this.step2.value }; }` spreads each FormGroup\'s value snapshot into one flat object — the standard pattern for collecting wizard data for final submission.',
    },
    {
      q: 'What happens if `step.update(s => s + 1)` is called without clamping and the step is already at the last index?',
      options: [
        'Angular throws an out-of-bounds error',
        'The step increments past the array, `currentForm` returns null, and no @case matches — the form area goes blank',
        'Angular wraps around to step 0 automatically',
        'The @switch renders the @default block',
      ],
      answer: 1,
      explanation: 'Without `Math.min(s + 1, maxStep)`, the step signal would increment to an out-of-bounds index. `currentForm` would return `null` and the `@switch` would have no matching `@case`, rendering nothing — creating a blank, confusing UI.',
    },
    {
      q: 'What is the key difference between `patchValue()` and `setValue()` on a FormGroup?',
      options: [
        '`patchValue` triggers all validators; `setValue` does not',
        '`patchValue` only updates provided keys; `setValue` requires ALL controls to be present in the object',
        '`patchValue` is async; `setValue` is synchronous',
        '`patchValue` resets touched/dirty state; `setValue` preserves it',
      ],
      answer: 1,
      explanation: '`patchValue` performs a partial update — only keys present in the argument are updated. `setValue` requires the object to exactly match the FormGroup\'s control structure, throwing if any key is missing or extra. `patchValue` is therefore safer for restoring partial state from localStorage.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why use separate FormGroups per step instead of one big FormGroup?',
      a: 'Per-step groups let you validate each step independently. Calling <code>step0.markAllAsTouched()</code> and checking <code>step0.invalid</code> only validates that step\'s fields — you don\'t prematurely expose errors on future steps the user hasn\'t seen yet.',
    },
    {
      q: 'How do you advance to the next step only if the current step is valid?',
      a: '<code>const form = this.currentForm(); if (form) &#123; form.markAllAsTouched(); if (form.invalid) return; &#125; this.step.update(s => s + 1);</code> — <code>markAllAsTouched()</code> reveals all errors; the early return prevents advancing on invalid state.',
    },
    {
      q: 'Should you validate on Back navigation?',
      a: 'No — back navigation should always succeed. Users must be able to move backward freely to correct earlier answers without being blocked by the current step\'s validation state. Only <code>next()</code> and <code>submit()</code> enforce validation.',
    },
    {
      q: 'How do you collect all step values for final submission?',
      a: 'Spread all step FormGroup values into one object: <code>const data = &#123; ...this.step0.value, ...this.step1.value, ...this.step2.value &#125;</code>. Ensure no overlapping keys between steps — later spreads silently overwrite earlier ones. Alternatively, add each step group as a child of a parent <code>FormGroup</code> with <code>addControl()</code>.',
    },
    {
      q: 'How do you save wizard progress across a page refresh?',
      a: 'Subscribe to each step\'s <code>valueChanges</code> and write to localStorage: <code>step0.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => localStorage.setItem(\'step0\', JSON.stringify(v)))</code>. On init, restore with <code>step0.patchValue(JSON.parse(localStorage.getItem(\'step0\') ?? \'null\') ?? &#123;&#125;)</code>. <code>patchValue</code> handles partial objects safely.',
    },
    {
      q: 'How do you implement a step indicator (stepper UI)?',
      a: 'Iterate the steps array with <code>@for</code>. Apply <code>[class.active]="step() === i"</code> for the current step and <code>[class.done]="step() &gt; i"</code> for completed steps. Add a connector div between circles with <code>[class.done]="step() &gt; i"</code>. Show a checkmark in completed circles: <code>&#123;&#123; step() &gt; i ? \'✓\' : s.icon &#125;&#125;</code>.',
    },
    {
      q: 'How do you handle async validation in a wizard without allowing premature step advancement?',
      a: 'Add the async validator to the control: <code>username: [\'\', [Validators.required], [usernameAvailabilityValidator]]</code>. Disable the Next button while pending: <code>[disabled]="step0.pending || step0.invalid"</code>. In <code>next()</code>, add: <code>if (form.pending) return</code> — because <code>form.valid</code> is <code>false</code> while async validation is in flight, the pending guard makes the UX intent explicit and prevents silent blocking.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signal()',           type: 'function',  desc: 'Creates a writable reactive signal; used here to track the current wizard step index.',                   since: '16' },
    { name: 'computed()',         type: 'function',  desc: 'Derives a read-only signal from other signals; used to map the step index to the active FormGroup.',      since: '16' },
    { name: 'signal.update()',    type: 'method',    desc: 'Updates a signal using a function of its current value — safe for next()/back() to avoid race conditions.', since: '16' },
    { name: 'markAllAsTouched',   type: 'method',    desc: 'Marks every control in a FormGroup as touched, making Angular display validation errors for untouched fields.', since: '8' },
    { name: 'FormBuilder.group',  type: 'method',    desc: 'Creates a FormGroup from a config object; the second argument accepts group-level validators for cross-field rules.', since: '2' },
    { name: 'patchValue',         type: 'method',    desc: 'Partially updates a FormGroup with only the provided keys — safe for restoring partial state from localStorage.',    since: '2' },
    { name: 'setValue',           type: 'method',    desc: 'Updates all controls at once; throws if any key is missing or extra — use patchValue for partial updates.',          since: '2' },
    { name: 'ReactiveFormsModule', type: 'class',    desc: 'Provides formGroup, formControlName, and related directives for binding template elements to reactive form controls.', since: '2' },
    { name: 'takeUntilDestroyed', type: 'function',  desc: 'RxJS operator that automatically completes an observable when the component is destroyed — use for valueChanges subscriptions.', since: '16' },
    { name: '@switch / @case',    type: 'syntax',    desc: 'Angular 17+ built-in control flow for rendering the active step\'s form content based on the step signal.',  since: '17' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Step tracking: imperative counter vs signal()',
      before: '// Old: plain property with manual increment\ncurrentStep = 0;\nnext() { this.currentStep++; }\nback() { this.currentStep--; }',
      after: '// New: signal with update() — reactive and bounds-safe\nstep = signal(0);\nnext() { this.step.update(s => Math.min(s + 1, maxStep)); }\nback() { this.step.update(s => Math.max(s - 1, 0)); }',
      note: 'signal.update() guarantees the new value is computed from the latest state, preventing race conditions in rapid navigation clicks.',
    },
    {
      title: 'Active form selection: imperative getter vs computed()',
      before: '// Old: imperative getter — re-evaluates on every read\nget currentForm() {\n  if (this.step === 0) return this.step0;\n  if (this.step === 1) return this.step1;\n  return null;\n}',
      after: '// New: computed() — memoised reactive derivation\ncurrentForm = computed(\n  () => [this.step0, this.step1, this.step2][this.step()] ?? null\n);',
      note: 'computed() re-evaluates only when step() changes, not on every change-detection cycle. The array lookup pattern scales cleanly to any number of steps.',
    },
    {
      title: 'Template step switching: *ngSwitch vs @switch',
      before: '<!-- Old: structural directive —>\n<ng-container [ngSwitch]="step">\n  <div *ngSwitchCase="0" [formGroup]="step0">...</div>\n  <div *ngSwitchCase="1" [formGroup]="step1">...</div>\n</ng-container>',
      after: '<!-- New: built-in control flow (Angular 17+) -->\n@switch (step()) {\n  @case (0) { <div [formGroup]="step0">...</div> }\n  @case (1) { <div [formGroup]="step1">...</div> }\n}',
      note: '@switch needs no NgSwitch import and has better tree-shaking. step() is evaluated as a signal read, automatically subscribing the template to changes.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Validating on Back navigation',
      wrong: 'back() {\n  this.currentForm()?.markAllAsTouched();\n  if (this.currentForm()?.invalid) return; // blocks going back!\n  this.step.update(s => s - 1);\n}',
      right: 'back() {\n  // Never validate going backward\n  this.step.update(s => Math.max(s - 1, 0));\n}',
      explanation: 'Blocking backward navigation traps users who need to fix earlier steps. Only Next and Submit should enforce validation — backward movement must always succeed.',
    },
    {
      title: 'Using one giant FormGroup for all steps',
      wrong: '// Single group means all errors appear at once\nform = this.fb.group({\n  firstName: [\'\', Validators.required],\n  email:     [\'\', Validators.required],\n  password:  [\'\', Validators.required],\n});',
      right: '// Per-step groups — validate only the active step\nstep0 = this.fb.group({ firstName: [\'\', Validators.required] });\nstep1 = this.fb.group({ email:     [\'\', Validators.required] });\nstep2 = this.fb.group({ password:  [\'\', Validators.required] });',
      explanation: 'A single FormGroup exposes all errors simultaneously and does not support step-by-step validation. Per-step groups let markAllAsTouched() operate on only the current step.',
    },
    {
      title: 'Forgetting markAllAsTouched() before checking invalid',
      wrong: 'next() {\n  if (this.currentForm()?.invalid) return; // errors never shown!\n  this.step.update(s => s + 1);\n}',
      right: 'next() {\n  const form = this.currentForm();\n  if (form) { form.markAllAsTouched(); if (form.invalid) return; }\n  this.step.update(s => s + 1);\n}',
      explanation: 'Angular only renders validation messages for touched controls. Without markAllAsTouched(), skipped fields silently block progress with no visible error — the user cannot tell why they cannot advance.',
    },
    {
      title: 'Placing cross-step validators on a child control',
      wrong: '// Control validator cannot read sibling controls\npassword: [\'\', [Validators.required, passwordMatchValidator]]',
      right: '// Group-level validator receives the whole FormGroup\nstep1 = this.fb.group(\n  { password: [\'\'], confirmPassword: [\'\'] },\n  { validators: passwordMatchValidator }\n);',
      explanation: 'A control validator only receives that single control\'s value. Cross-field rules (password confirmation, date range) need a group-level validator so both sibling controls are accessible.',
    },
    {
      title: 'Advancing while an async validator is still pending',
      wrong: 'next() {\n  const form = this.currentForm();\n  if (form?.invalid) return; // pending !== valid, but no indicator\n  this.step.update(s => s + 1);\n}',
      right: 'next() {\n  const form = this.currentForm();\n  if (!form) { this.step.update(s => s + 1); return; }\n  form.markAllAsTouched();\n  if (form.invalid || form.pending) return; // guard both!\n  this.step.update(s => s + 1);\n}',
      explanation: 'A control with an async validator is PENDING — form.valid is false — but no error message is visible. Guarding on form.pending is explicit, and pairing it with [disabled]="form.pending" on the Next button removes ambiguity.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a Confirm Password field with cross-field validation',
    description: 'Extend the Account Setup step (step1) to include a `confirmPassword` field. Add a custom group-level validator that checks whether `password` and `confirmPassword` match. Display an error message under the confirm field when they do not match. The Next button should stay blocked until passwords match.',
    language: 'typescript',
    hints: [
      'Pass the validator as a second argument to fb.group(): `this.fb.group({ ... }, { validators: passwordMatchValidator })`. Group validators receive the FormGroup as their argument.',
      'The validator returns null when valid, or an error object like `{ passwordMismatch: true }` when invalid. Access sibling values with `group.get(\'password\')?.value`.',
      'In the template, check the group-level error with `step1.hasError(\'passwordMismatch\')` combined with the touched state of confirmPassword to avoid showing the error prematurely.',
      'The existing `next()` already calls `form.markAllAsTouched()` and returns early on `form.invalid` — group-level errors automatically make the form invalid, so no navigation changes are needed.',
    ],
    starterCode: `import { AbstractControl, ValidationErrors, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';

// TODO 1: Write a passwordMatchValidator(control: AbstractControl): ValidationErrors | null
// Read 'password' and 'confirmPassword' from the group.
// Return { passwordMismatch: true } when they differ, null when they match.

@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="step1">
      <input formControlName="username" placeholder="Username" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />

      <!-- TODO 3: Add a confirmPassword input here -->
      <!-- TODO 4: Show error when step1.hasError('passwordMismatch')
                   AND confirmPassword is touched -->

      <button type="button" (click)="next()">Next</button>
    </form>
  \`,
})
export class AccountStepDemo {
  private fb = inject(FormBuilder);

  // TODO 2: Add confirmPassword control + pass passwordMatchValidator as group validator
  step1 = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  next() {
    this.step1.markAllAsTouched();
    if (this.step1.invalid) return;
    console.log('Step valid:', this.step1.value);
  }
}`,
    solution: `import { AbstractControl, ValidationErrors, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';

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
    <form [formGroup]="step1">
      <input formControlName="username" placeholder="Username" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password (8+ chars)" />

      <div>
        <input type="password" formControlName="confirmPassword" placeholder="Confirm password" />
        @if (step1.hasError('passwordMismatch') && step1.get('confirmPassword')?.touched) {
          <p class="error">Passwords do not match.</p>
        }
      </div>

      <button type="button" (click)="next()">Next</button>
    </form>
  \`,
})
export class AccountStepDemo {
  private fb = inject(FormBuilder);

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
    if (this.step1.invalid) return;
    console.log('Step valid:', this.step1.value);
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Multi-step wizard forms split a complex reactive form into independent per-step <code>FormGroup</code>s, each validated separately before advancing — combining <code>signal()</code> for step state, <code>computed()</code> for the active form reference, and <code>markAllAsTouched()</code> for error revelation.',
    mustKnow: [
      'One <code>FormGroup</code> per step — NOT one giant group. Independent groups allow per-step validation without exposing future-step errors.',
      '<code>currentForm = computed(() => [step0, step1, step2][this.step()] ?? null)</code> — reactive, memoised reference to the active form.',
      '<code>next()</code>: always <code>form.markAllAsTouched()</code> then check <code>form.invalid</code> before calling <code>step.update()</code>.',
      '<code>back()</code>: NEVER validate — always decrement unconditionally. Users must move backward freely.',
      'Clamp bounds: <code>Math.min(s + 1, maxStep)</code> and <code>Math.max(s - 1, 0)</code> in <code>update()</code> to prevent blank step rendering.',
      'Collect final payload: <code>&#123; ...step0.value, ...step1.value, ...step2.value &#125;</code> — ensure no overlapping keys.',
      'Cross-field validation within a step: group-level validator — <code>fb.group(&#123;...&#125;, &#123; validators: matchValidator &#125;)</code>.',
    ],
    interviewFocus: [
      'Q: Why create one FormGroup per step instead of one FormGroup for the whole wizard?',
      'Q: What is the difference between <code>patchValue()</code> and <code>setValue()</code> on a FormGroup?',
      'Q: Why must <code>back()</code> never call <code>markAllAsTouched()</code> or check <code>form.invalid</code>?',
      'Q: How do you guard against advancing when an async validator is still in flight (PENDING state)?',
      'Q: How would you make a wizard deep-linkable so users can share a URL directly to step 3?',
    ],
  };
}
