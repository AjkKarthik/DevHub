import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
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

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

const SCHEMA: FieldConfig[] = [
  { key: 'fullName',  label: 'Full Name',    type: 'text',     placeholder: 'John Doe',          required: true  },
  { key: 'email',     label: 'Email',         type: 'email',    placeholder: 'john@example.com',  required: true  },
  { key: 'age',       label: 'Age',           type: 'number',   placeholder: '25'                                 },
  { key: 'role',      label: 'Role',          type: 'select',   required: true,
    options: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }, { label: 'Manager', value: 'mgr' }] },
  { key: 'bio',       label: 'Bio',           type: 'textarea', placeholder: 'Tell us about yourself…'       },
  { key: 'terms',     label: 'Accept terms',  type: 'checkbox', required: true                                    },
];

@Component({
  selector: 'app-dynamic-forms',
  imports: [
    ReactiveFormsModule, JsonPipe,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './dynamic-forms.html',
  styleUrl: './dynamic-forms.scss',
})
export class DynamicFormsDemo {
  private fb = inject(FormBuilder);

  prerequisites: Prerequisite[] = [
    { label: 'Custom Validators', route: '/angular/custom-validators' },
    { label: 'Form Array', route: '/angular/form-array' },
  ];

  schema  = SCHEMA;
  form    = this.buildForm(SCHEMA);
  result  = signal<unknown>(null);

  private buildForm(schema: FieldConfig[]) {
    const group: Record<string, unknown> = {};
    for (const field of schema) {
      const validators: ValidatorFn[] = field.required ? [Validators.required] : [];
      if (field.type === 'email') validators.push(Validators.email);
      group[field.key] = [field.type === 'checkbox' ? false : '', validators];
    }
    return this.fb.group(group);
  }

  submit() {
    if (this.form.valid) this.result.set(this.form.value);
    else this.form.markAllAsTouched();
  }

  isInvalid(key: string) {
    const c = this.form.get(key);
    return c?.invalid && c?.touched;
  }

  theory: TheoryPoint[] = [
    {
      heading: 'What are dynamic / schema-driven forms?',
      points: [
        'Schema-driven forms build the form structure at runtime from a JSON/object config — no static template per field, and no manual <code>FormGroup</code> declaration per variant.',
        'A single template loop renders every field type by inspecting the config object, so adding a new field means updating the schema array, not rewriting the template or component.',
        'The backend can drive the form shape entirely — essential for CMS, survey builders, admin UIs, and multi-tenant apps where different users see different fields without a frontend deploy.',
        'The <code>FormGroup</code> is built programmatically from the same schema object, so the reactive logic and the rendered controls stay in sync without duplication.',
        'The pattern separates form declaration (the schema) from form rendering (the template), making forms easy to test in isolation, serialise as JSON, and store in a database or remote API.',
      ],
    },
    {
      heading: 'Designing the FieldConfig schema',
      points: [
        'Start with a discriminated union on the <code>type</code> property: <code>\'text\' | \'email\' | \'number\' | \'textarea\' | \'checkbox\' | \'select\'</code>. This single value drives both the input rendered in the template and the validators applied in <code>buildForm()</code>.',
        'Use <code>key: string</code> as the unique per-field identifier — it becomes the <code>FormControl</code> name inside the <code>FormGroup</code> and the <code>formControlName</code> binding value in the template, coupling the two through one string.',
        '<code>options?: &#123; label: string; value: string &#125;[]</code> is only meaningful for <code>select</code> and radio types — use a discriminated union sub-type in production to get compile-time narrowing.',
        'Add optional validator hints as scalars — <code>required?: boolean</code>, <code>minLength?: number</code>, <code>maxLength?: number</code>, <code>pattern?: string</code> — so <code>buildForm()</code> can compose them from the config without hardcoding validators per field, and the schema stays serialisable to JSON.',
        'Add a <code>conditional?: &#123; dependsOn: string; showWhen: unknown &#125;</code> property to make fields context-sensitive — show or hide a field based on another field\'s current value without duplicating the form for each variant.',
      ],
    },
    {
      heading: 'Building the FormGroup programmatically',
      points: [
        'Iterate the schema with <code>for...of</code>, accumulating a <code>Record&lt;string, unknown&gt;</code> group object, then call <code>fb.group(group)</code> once. Angular converts each entry into a <code>FormControl</code> in one step.',
        'Derive validators from the schema: <code>const validators: ValidatorFn[] = field.required ? [Validators.required] : []</code>. Push conditionally: <code>if (field.type === \'email\') validators.push(Validators.email)</code>. The same loop logic can handle any schema-level constraint.',
        'Set the initial control value based on type: checkboxes start as <code>false</code> (boolean), all other types start as <code>\'\'</code> (empty string). Mismatching — e.g., using <code>false</code> for a text control — causes silent coercion bugs in the submitted value.',
        'Cache the <code>FormGroup</code> in a class field: <code>form = this.buildForm(this.schema)</code>. Never call <code>buildForm()</code> in a getter or on every change-detection cycle — it destroys all user input and resets validation state on every tick.',
        '<code>Validators.compose(validators)</code> merges an array of validators into one function; it returns <code>null</code> when given an empty array, which Angular treats as no validator — safe to use unconditionally instead of branching on array length.',
      ],
    },
    {
      heading: 'Template rendering with @switch',
      points: [
        'Use <code>@switch (field.type)</code> with one <code>@case</code> per input type. Each case renders the matching <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code>, or <code>&lt;textarea&gt;</code> element bound via <code>[formControlName]="field.key"</code>.',
        '<code>[formControlName]="field.key"</code> is a dynamic binding — the square brackets evaluate <code>field.key</code> as an expression, not a literal string. This wires each rendered control to its matching key in the <code>FormGroup</code> automatically.',
        'Use <code>@for (field of schema; track field.key)</code> — tracking by <code>field.key</code> (not <code>$index</code>) ensures Angular reuses existing DOM nodes when the schema order changes, preventing control reset and input focus loss.',
        'For select fields, iterate <code>field.options ?? []</code> in a nested <code>@for</code> to render <code>&lt;option&gt;</code> elements. Guarding with <code>?? []</code> prevents a runtime error when <code>options</code> is undefined on non-select fields.',
        'Call <code>form.markAllAsTouched()</code> on an invalid submit to reveal all error messages at once — the <code>isInvalid()</code> helper relies on <code>.touched</code>, so validation errors stay hidden until the user interacts with each field otherwise.',
      ],
    },
    {
      heading: 'Conditional fields and schema mutation',
      points: [
        'A field with <code>conditional: &#123; dependsOn: \'role\', showWhen: \'admin\' &#125;</code> should only render when the <code>role</code> control equals <code>\'admin\'</code>. Evaluate this in a helper: <code>isVisible(f) &#123; return !f.conditional || this.form.get(f.conditional.dependsOn)?.value === f.conditional.showWhen &#125;</code>.',
        'Simply hiding a conditional field with <code>@if</code> is not enough — the <code>FormControl</code> still lives in the <code>FormGroup</code>. Call <code>form.removeControl(field.key)</code> when the field hides and <code>form.addControl</code> when it shows, so it is excluded from <code>form.value</code> and from validity checks.',
        'To replace the entire schema at runtime (e.g., user picks a different form type), call <code>this.form = this.buildForm(newSchema)</code> and reset the result signal. Never mutate the existing <code>FormGroup</code> in place — rebuild it cleanly from the new schema.',
        '<code>setControl(name, control)</code> is the safe way to replace a single existing control: unlike <code>addControl</code>, it does not throw if the key already exists. Use it to update a field\'s validators without rebuilding the whole form.',
        'Schema mutations can leave stale data — always call <code>form.reset()</code> or rebuild after a schema change so hidden field values do not appear in the submitted payload.',
      ],
    },
    {
      heading: 'Best practices and library options',
      points: [
        'For enterprise-scale dynamic forms, Angular Formly (<code>@ngx-formly/core</code>) provides a declarative config-driven system with conditional fields, nested groups, custom field types, validation expressions, and extension points out of the box.',
        'Keep <code>FieldConfig</code> serialisable to JSON: express validators as optional scalar properties (<code>minLength</code>, <code>maxLength</code>, <code>pattern</code>) rather than <code>ValidatorFn[]</code> references, so the schema can be stored in a database or returned from an API.',
        'Strong typing: derive a mapped type from the schema keys — <code>type FormModel = Record&lt;FieldKey, FormControl&lt;string | boolean&gt;&gt;</code> — and create a <code>FormGroup&lt;FormModel&gt;</code>. TypeScript then catches unknown <code>formControlName</code> bindings at compile time.',
        'Separate <code>buildForm()</code> into a pure utility function (not a class method) so both the component and unit tests can call it without instantiating the component — making <code>FormGroup</code> construction testable in isolation.',
        'For large schemas (20+ fields), use <code>ChangeDetectionStrategy.OnPush</code> and drive updates via <code>form.statusChanges</code> and <code>form.valueChanges</code> piped through <code>takeUntilDestroyed()</code> to minimise change-detection overhead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema definition',
      language: 'typescript',
      code: `interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  options?: { label: string; value: string }[];
}

const SCHEMA: FieldConfig[] = [
  { key: 'name',  label: 'Name',  type: 'text',   required: true, minLength: 2 },
  { key: 'email', label: 'Email', type: 'email',  required: true               },
  { key: 'role',  label: 'Role',  type: 'select', required: true,
    options: [
      { label: 'Developer', value: 'dev' },
      { label: 'Designer',  value: 'design' },
      { label: 'Manager',   value: 'mgr' },
    ],
  },
  { key: 'bio',   label: 'Bio',   type: 'textarea', placeholder: 'Tell us about yourself…' },
];

// Extend with conditional support:
interface FieldConfig {
  // ...existing fields...
  conditional?: { dependsOn: string; showWhen: unknown };
}`,
    },
    {
      label: 'Build FormGroup',
      language: 'typescript',
      code: `private buildForm(schema: FieldConfig[]) {
  const group: Record<string, unknown> = {};

  for (const field of schema) {
    // Start with required validator if needed
    const validators: ValidatorFn[] = field.required
      ? [Validators.required]
      : [];

    // Push type-based validators
    if (field.type === 'email')    validators.push(Validators.email);
    if (field.minLength)           validators.push(Validators.minLength(field.minLength));

    // Checkbox starts as false (boolean); everything else as '' (string)
    group[field.key] = [
      field.type === 'checkbox' ? false : '',
      Validators.compose(validators),  // null when empty — Angular treats as no validator
    ];
  }

  return this.fb.group(group);
}

// Cache result — NEVER call buildForm() in a getter
form = this.buildForm(SCHEMA);`,
    },
    {
      label: 'Template loop',
      language: 'html',
      code: `@for (field of schema; track field.key) {
  <div class="field">
    <label [for]="field.key">
      {{ field.label }}
      @if (field.required) { <span class="req">*</span> }
    </label>

    @switch (field.type) {
      @case ('text') {
        <input [id]="field.key" type="text"
               [formControlName]="field.key"
               [placeholder]="field.placeholder ?? ''" />
      }
      @case ('email') {
        <input [id]="field.key" type="email"
               [formControlName]="field.key"
               [placeholder]="field.placeholder ?? ''" />
      }
      @case ('textarea') {
        <textarea [id]="field.key" rows="3"
                  [formControlName]="field.key"
                  [placeholder]="field.placeholder ?? ''"></textarea>
      }
      @case ('checkbox') {
        <label class="checkbox-label">
          <input type="checkbox" [formControlName]="field.key" />
          {{ field.label }}
        </label>
      }
      @case ('select') {
        <select [id]="field.key" [formControlName]="field.key">
          <option value="">Select…</option>
          @for (opt of field.options ?? []; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      }
    }

    @if (isInvalid(field.key)) {
      <span class="error">{{ field.label }} is required</span>
    }
  </div>
}`,
    },
    {
      label: 'Conditional fields',
      language: 'typescript',
      code: `// FieldConfig extended with conditional rule
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'select';
  conditional?: { dependsOn: string; showWhen: unknown };
  required?: boolean;
}

@Component({ ... })
export class DynamicFormComponent {
  private fb = inject(FormBuilder);

  schema: FieldConfig[] = [
    { key: 'role',      type: 'select', label: 'Role', required: true,
      options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] },
    { key: 'adminCode', type: 'text',   label: 'Admin Code',
      conditional: { dependsOn: 'role', showWhen: 'admin' },
      required: true },
  ];

  form = this.buildForm(this.schema);

  // Show/hide helper used in template with @if
  isVisible(field: FieldConfig): boolean {
    if (!field.conditional) return true;
    return this.form.get(field.conditional.dependsOn)?.value === field.conditional.showWhen;
  }

  // Toggle the control when visibility changes
  updateConditionalControls(): void {
    for (const field of this.schema) {
      if (!field.conditional) continue;
      const visible = this.isVisible(field);
      const exists  = !!this.form.get(field.key);
      if (visible && !exists) {
        this.form.addControl(field.key,
          this.fb.control('', field.required ? Validators.required : null));
      } else if (!visible && exists) {
        this.form.removeControl(field.key);
      }
    }
  }
}

// In template:
// @for (field of schema; track field.key) {
//   @if (isVisible(field)) {
//     <div class="field">...</div>
//   }
// }`,
    },
    {
      label: 'Typed FormGroup',
      language: 'typescript',
      code: `import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';

// Manually typed model for a known schema
interface ProfileForm {
  fullName: FormControl<string>;
  email:    FormControl<string>;
  role:     FormControl<string>;
  terms:    FormControl<boolean>;
}

@Component({ ... })
export class ProfileFormComponent {
  private fb = inject(NonNullableFormBuilder);

  // Fully typed FormGroup — TS catches unknown formControlName bindings
  form: FormGroup<ProfileForm> = this.fb.group({
    fullName: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email:    this.fb.control('', [Validators.required, Validators.email]),
    role:     this.fb.control('', Validators.required),
    terms:    this.fb.control(false, Validators.requiredTrue),
  });

  // Typed access — no 'as string' casts needed
  get emailErrors() {
    return this.form.controls.email.errors;
  }

  submit() {
    if (!this.form.valid) { this.form.markAllAsTouched(); return; }

    const value = this.form.getRawValue(); // type: { fullName: string; email: string; role: string; terms: boolean }
    console.log(value);
  }
}

// For truly dynamic schemas, use an untyped FormGroup and narrow at the boundary:
// form: FormGroup = this.buildForm(schema);
// const typed = form.getRawValue() as Record<string, string | boolean>;`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'In `buildForm()`, what initial value is assigned to a checkbox field when creating its FormControl?',
      options: ['An empty string \'\'', 'null', 'false', 'undefined'],
      answer: 2,
      explanation: 'The code uses `field.type === \'checkbox\' ? false : \'\'` — checkboxes start as boolean `false` while all other field types start as an empty string. Mismatching the type causes silent coercion bugs in the submitted value.',
    },
    {
      q: 'Which Angular directive binds the programmatically-created FormGroup to the `<form>` element in the template?',
      options: ['[ngModel]', '[formGroup]', 'formGroupName', 'ngForm'],
      answer: 1,
      explanation: '`[formGroup]="form"` on the `<form>` element attaches the ReactiveFormsModule to the instance. `formGroupName` is for nested sub-groups inside a parent form, and `ngModel` belongs to template-driven forms.',
    },
    {
      q: 'In the `@for` loop, what should the `track` expression use, and why is `$index` the wrong choice?',
      options: [
        '`field.label` — it is the human-readable value shown to users',
        '`field.type` — it determines which input is rendered',
        '`field.key` — it is a unique, stable identifier that also matches formControlName',
        '`$index` — Angular requires numeric tracking for reactive forms',
      ],
      answer: 2,
      explanation: '`field.key` is both unique per field and the same value used as `formControlName`, making it the correct stable identity for DOM diffing. Using `$index` would cause Angular to destroy and recreate DOM nodes when the schema order changes, resetting all control values.',
    },
    {
      q: 'What does `submit()` do when `this.form.valid` is `false`?',
      options: [
        'The form resets to its initial values',
        'The result signal is set to an empty object',
        '`markAllAsTouched()` is called so validation errors become visible',
        'A console error is thrown listing invalid fields',
      ],
      answer: 2,
      explanation: 'The `submit()` method calls `this.form.markAllAsTouched()` when the form is invalid. This triggers the `isInvalid()` checks in the template — which depend on `.touched` — to display error messages without actually submitting the form.',
    },
    {
      q: 'Which field type in the SCHEMA array uses the `options` property?',
      options: ['textarea', 'checkbox', 'number', 'select'],
      answer: 3,
      explanation: 'Only the `select` field type uses the `options` array (e.g., the `role` field with Developer / Designer / Manager options). The `@case (\'select\')` block in the template iterates `field.options` to render `<option>` elements — other types ignore this property entirely.',
    },
    {
      q: 'What is the key difference between `form.addControl(name, ctrl)` and `form.setControl(name, ctrl)` when the key already exists?',
      options: [
        '`addControl` triggers validation immediately; `setControl` defers it',
        '`setControl` replaces the existing control safely; `addControl` throws an error if the key exists',
        '`addControl` marks the control as required; `setControl` clears validators',
        '`setControl` rebuilds the entire FormGroup; `addControl` only inserts one control',
      ],
      answer: 1,
      explanation: '`addControl` throws a runtime error if a control with that key already exists, while `setControl` safely replaces it. Use `setControl` when the schema updates a field\'s validators at runtime without rebuilding the whole form.',
    },
    {
      q: 'A conditional field is hidden with `@if` but its FormControl is NOT removed from the FormGroup. What is the consequence when the user submits?',
      options: [
        'Angular throws a runtime error because the control has no DOM element',
        'The hidden field\'s value is included in form.value and can keep form.valid === false if it has validators',
        'The control is automatically set to null and excluded from form.value',
        'The FormGroup emits a statusChange event and disables the submit button',
      ],
      answer: 1,
      explanation: '`FormGroup.value` includes all registered controls regardless of DOM visibility. If the hidden field has `Validators.required` it will still cause `form.valid` to be `false`. Always call `form.removeControl()` or `form.get(key).disable()` when hiding a field to exclude it from value and validity.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why build a form from a schema instead of hardcoding the template?',
      a: 'Schema-driven forms let the backend control the form shape at runtime — add or remove fields without a frontend deploy. Essential for CMS, survey builders, and multi-tenant apps where different users see different forms. The schema is serialisable to JSON, storeable in a database, and versionable independently of the Angular component.',
    },
    {
      q: 'How do you apply different validators per field from a schema?',
      a: 'Inspect the schema in <code>buildForm()</code>: <code>const validators: ValidatorFn[] = field.required ? [Validators.required] : []</code>. Push additional validators conditionally: <code>if (field.type === \'email\') validators.push(Validators.email)</code>. <code>Validators.compose(validators)</code> merges them into one function, returning <code>null</code> for an empty array (treated as no validator).',
    },
    {
      q: 'How do you render different input types from the schema?',
      a: 'Use <code>@switch (field.type)</code> in the template with a <code>@case</code> per type: text, email, number, select, textarea, checkbox. Each case renders the appropriate <code>&lt;input&gt;</code> or <code>&lt;select&gt;</code> element bound to <code>[formControlName]="field.key"</code>. The dynamic binding (square brackets) evaluates <code>field.key</code> as an expression — not a string literal.',
    },
    {
      q: 'How do you type the FormGroup for a dynamic schema?',
      a: 'Use <code>Record&lt;string, unknown&gt;</code> for the builder group object — the resulting <code>FormGroup</code> is loosely typed but fully functional. For stronger typing, define a mapped type from the schema keys: <code>type FormModel = &#123; fullName: FormControl&lt;string&gt;; email: FormControl&lt;string&gt;; terms: FormControl&lt;boolean&gt; &#125;</code> and pass it to <code>FormGroup&lt;FormModel&gt;</code>. TypeScript then catches unknown <code>formControlName</code> bindings at compile time.',
    },
    {
      q: 'How do you show a validation error for a dynamic field?',
      a: 'Create a helper: <code>isInvalid(key: string) &#123; const c = this.form.get(key); return c?.invalid && c?.touched; &#125;</code>. In the template: <code>@if (isInvalid(field.key)) &#123; &lt;span class="error"&gt;...&lt;/span&gt; &#125;</code>. On invalid submit, call <code>this.form.markAllAsTouched()</code> to force all error spans visible — otherwise errors stay hidden until the user touches each field.',
    },
    {
      q: 'What library handles complex dynamic forms in Angular?',
      a: 'Angular Formly (<code>@ngx-formly/core</code>) is the de-facto standard for complex schema-driven forms. It supports nested groups, conditional fields, custom field types, validation expressions, wrappers, and rich extension points — all from a declarative config array without writing a generic template loop yourself.',
    },
    {
      q: 'How do you conditionally show or hide a form field based on another field\'s value?',
      a: 'Add a <code>conditional: &#123; dependsOn: \'role\', showWhen: \'admin\' &#125;</code> property to the field config. In a helper: <code>isVisible(f) &#123; return !f.conditional || this.form.get(f.conditional.dependsOn)?.value === f.conditional.showWhen &#125;</code>. Wrap the field in <code>@if (isVisible(field))</code> in the template. Crucially, call <code>form.removeControl(field.key)</code> when hiding and <code>form.addControl</code> when showing — otherwise the hidden control remains in <code>form.value</code> and can block <code>form.valid</code>.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormBuilder',         type: 'class',      desc: 'Service that creates FormGroup, FormControl, and FormArray instances with a concise builder API.',            since: '2' },
    { name: 'FormGroup',           type: 'class',      desc: 'Tracks the value and validity state of a group of FormControl instances, keyed by name.',                   since: '2' },
    { name: 'FormControl',         type: 'class',      desc: 'Tracks the value and validation status of an individual form input element.',                               since: '2' },
    { name: 'ReactiveFormsModule', type: 'class',      desc: 'Module that exports reactive form directives: formGroup, formControlName, formArrayName, and more.',        since: '2' },
    { name: 'Validators',          type: 'class',      desc: 'Built-in validators: required, email, minLength, maxLength, pattern — composable per field from a schema.', since: '2' },
    { name: 'formControlName',     type: 'directive',  desc: 'Binds a FormControl registered in a parent FormGroup to a DOM input element using the control\'s string key.', since: '2' },
    { name: 'formGroup',           type: 'directive',  desc: 'Binds a FormGroup instance to a <form> element, enabling reactive form directives inside it.',             since: '2' },
    { name: 'markAllAsTouched',    type: 'method',     desc: 'Marks all controls in a FormGroup (and nested groups) as touched, triggering validation error display without submitting.', since: '8' },
    { name: 'Validators.compose',  type: 'method',     desc: 'Merges an array of ValidatorFn functions into a single validator; returns null for an empty array.',        since: '2' },
    { name: 'setControl',          type: 'method',     desc: 'Replaces an existing FormControl within a FormGroup without throwing if the key already exists.',           since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Building a FormGroup: manual construction vs FormBuilder',
      before: '// Verbose: manually constructing controls\nconst group = new FormGroup({\n  name:  new FormControl(\'\', Validators.required),\n  email: new FormControl(\'\', [Validators.required, Validators.email]),\n});',
      after: '// Concise: FormBuilder shorthand (less boilerplate)\nprivate fb = inject(FormBuilder);\n\nconst group = this.fb.group({\n  name:  [\'\', Validators.required],\n  email: [\'\', [Validators.required, Validators.email]],\n});',
      note: 'FormBuilder.group() accepts [initialValue, validators] tuples, reducing noise — especially important when building groups programmatically inside a schema loop.',
    },
    {
      title: 'Rendering field types: *ngSwitch vs @switch',
      before: '<!-- Old: structural directive syntax -->\n<ng-container [ngSwitch]="field.type">\n  <input *ngSwitchCase="\'text\'"  [formControlName]="field.key" />\n  <input *ngSwitchCase="\'email\'" [formControlName]="field.key" />\n  <ng-container *ngSwitchDefault>...</ng-container>\n</ng-container>',
      after: '<!-- New: built-in control flow (Angular 17+) -->\n@switch (field.type) {\n  @case (\'text\')  { <input type="text"  [formControlName]="field.key" /> }\n  @case (\'email\') { <input type="email" [formControlName]="field.key" /> }\n  @default        { <textarea [formControlName]="field.key"></textarea> }\n}',
      note: '@switch/@case is native template syntax — no NgModule import, no wrapper element needed, and TypeScript type narrowing works inside each case block.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Rebuilding FormGroup on every render (getter anti-pattern)',
      wrong: '// Called on every change-detection cycle\nget form() {\n  return this.buildForm(this.schema);\n}',
      right: '// Build once at field-initializer level\nform = this.buildForm(this.schema);',
      explanation: 'Calling buildForm() inside a getter destroys and recreates all controls on every cycle, losing user input and resetting validation state. Build once and cache — rebuild only when the schema actually changes.',
    },
    {
      title: 'Forgetting ReactiveFormsModule in the component imports',
      wrong: '@Component({\n  selector: \'app-form\',\n  template: \'<form [formGroup]="form">...</form>\',\n  // imports missing — formGroup directive not resolved\n})',
      right: '@Component({\n  selector: \'app-form\',\n  imports: [ReactiveFormsModule],\n  template: \'<form [formGroup]="form">...</form>\',\n})',
      explanation: 'In standalone components, directives like formGroup and formControlName are not globally available — ReactiveFormsModule must be listed in the component\'s imports array or the template throws a "Can\'t bind to formGroup" error at runtime.',
    },
    {
      title: 'Tracking by $index instead of a stable unique key',
      wrong: '@for (field of schema; track $index) {\n  <input [formControlName]="field.key" />\n}',
      right: '@for (field of schema; track field.key) {\n  <input [formControlName]="field.key" />\n}',
      explanation: 'Tracking by $index causes Angular to destroy and recreate DOM nodes when the schema order changes, resetting control values and stealing focus. field.key is stable, unique, and already used as the formControlName — it\'s the natural tracking key.',
    },
    {
      title: 'Skipping markAllAsTouched on invalid submit',
      wrong: 'submit() {\n  if (this.form.valid) this.result = this.form.value;\n  // form invalid: nothing happens, errors stay hidden\n}',
      right: 'submit() {\n  if (this.form.valid) this.result = this.form.value;\n  else this.form.markAllAsTouched();\n}',
      explanation: 'Validation error spans conditioned on .touched stay hidden until the user individually interacts with each field. markAllAsTouched() forces all error states visible on a failed submit attempt without requiring user interaction per field.',
    },
    {
      title: 'Not rebuilding the form when the schema changes',
      wrong: '// Schema updated but form still has old controls\nthis.schema = newSchema;',
      right: '// Rebuild the FormGroup from the new schema\nthis.schema = newSchema;\nthis.form = this.buildForm(newSchema);\nthis.result.set(null);',
      explanation: 'When the schema changes, the existing FormGroup retains all old controls. Stale controls from the previous schema pollute form.value, may hold user input from a different variant, and their validators can block submission. Always rebuild the form when the schema changes.',
    },
  ];

  challenge: Challenge = {
    title: 'Add a minLength validator to text fields',
    description: 'The current `buildForm()` only applies `Validators.required` and `Validators.email`. Extend the `FieldConfig` interface to accept an optional `minLength` property, then update `buildForm()` to push `Validators.minLength(field.minLength)` when that property is present. Add `minLength: 3` to the `fullName` field in the schema and verify the error message shows when fewer than 3 characters are entered.',
    language: 'typescript',
    hints: [
      'Add `minLength?: number` to the `FieldConfig` interface — TypeScript will then allow you to set it in the schema array.',
      'Inside the `for` loop in `buildForm()`, add `if (field.minLength) validators.push(Validators.minLength(field.minLength));` after the existing validator checks.',
      'The `isInvalid()` helper returns true for ANY validation error on a touched control, so your existing error span will light up automatically — no template changes needed.',
      'To test, type 1–2 characters in the Full Name field and tab away — the error span should appear because the control is invalid (minLength not met) and touched.',
    ],
    starterCode: `interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  // TODO: add an optional minLength property here
}

const SCHEMA: FieldConfig[] = [
  { key: 'fullName', label: 'Full Name', type: 'text',
    placeholder: 'John Doe', required: true },
  { key: 'email',   label: 'Email',     type: 'email',
    placeholder: 'john@example.com', required: true },
  { key: 'role',    label: 'Role',      type: 'select', required: true,
    options: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }] },
  { key: 'terms',   label: 'Accept terms', type: 'checkbox', required: true },
];

private buildForm(schema: FieldConfig[]) {
  const group: Record<string, unknown> = {};
  for (const field of schema) {
    const validators = field.required ? [Validators.required] : [];
    if (field.type === 'email') validators.push(Validators.email);
    // TODO: push Validators.minLength when field.minLength is set
    group[field.key] = [field.type === 'checkbox' ? false : '', validators];
  }
  return this.fb.group(group);
}`,
    solution: `interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  minLength?: number; // NEW
  options?: { label: string; value: string }[];
}

const SCHEMA: FieldConfig[] = [
  { key: 'fullName', label: 'Full Name', type: 'text',
    placeholder: 'John Doe', required: true, minLength: 3 }, // minLength added
  { key: 'email',   label: 'Email',     type: 'email',
    placeholder: 'john@example.com', required: true },
  { key: 'role',    label: 'Role',      type: 'select', required: true,
    options: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }] },
  { key: 'terms',   label: 'Accept terms', type: 'checkbox', required: true },
];

private buildForm(schema: FieldConfig[]) {
  const group: Record<string, unknown> = {};
  for (const field of schema) {
    const validators = field.required ? [Validators.required] : [];
    if (field.type === 'email') validators.push(Validators.email);
    if (field.minLength)        validators.push(Validators.minLength(field.minLength)); // NEW
    group[field.key] = [field.type === 'checkbox' ? false : '', validators];
  }
  return this.fb.group(group);
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Schema-driven forms build a reactive <code>FormGroup</code> and template entirely from a runtime config object — one <code>buildForm()</code> function and one template loop handle every field type, letting the backend control the form shape without frontend deploys.',
    mustKnow: [
      'Define a <code>FieldConfig</code> interface with <code>key</code>, <code>label</code>, <code>type</code>, optional validator scalars, and <code>options</code>',
      '<code>buildForm(schema)</code> iterates the config, builds a group object, and calls <code>fb.group()</code> — cache the result in a class field, never in a getter',
      'Use <code>@for (field of schema; track field.key)</code> with <code>@switch (field.type)</code> and <code>[formControlName]="field.key"</code> — the dynamic binding evaluates <code>field.key</code> as an expression',
      'Checkbox controls need <code>false</code> as initial value; all other types use <code>\'\'</code> — mismatching the type causes silent coercion bugs',
      'Call <code>form.markAllAsTouched()</code> on invalid submit to reveal all error messages at once',
      'Hidden conditional fields must be removed with <code>form.removeControl()</code> — they stay in <code>form.value</code> and block <code>form.valid</code> otherwise',
      'For enterprise schemas use Angular Formly (<code>@ngx-formly/core</code>) — handles conditional fields, nested groups, and custom widgets declaratively',
    ],
    interviewFocus: [
      'Q: Walk through how <code>buildForm()</code> applies different validators per field from a JSON schema',
      'Q: Why track by <code>field.key</code> not <code>$index</code> in the <code>@for</code> loop?',
      'Q: A hidden field has <code>Validators.required</code>. Why does <code>form.valid</code> stay <code>false</code> even though the field is not shown?',
      'Q: What is the difference between <code>addControl</code> and <code>setControl</code> on a FormGroup?',
      'Q: When would you use Angular Formly instead of building your own schema-driven form?',
    ],
  };
}
