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
  { key: 'bio',       label: 'Bio',           type: 'textarea', placeholder: 'Tell us about yourself…'            },
  { key: 'terms',     label: 'Accept terms',  type: 'checkbox', required: true                                    },
];

@Component({
  selector: 'app-dynamic-forms',
  imports: [ReactiveFormsModule, CodeBlockComponent, TheoryBlockComponent, JsonPipe, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './dynamic-forms.html',
  styleUrl: './dynamic-forms.scss',
})
export class DynamicFormsDemo {
  private fb = new FormBuilder();

  qna: QnaItem[] = [
    { q: 'Why build a form from a schema instead of hardcoding the template?', a: 'Schema-driven forms let the backend control the form shape at runtime — add/remove fields without a frontend deploy. Essential for CMS, survey builders, and multi-tenant apps where different users see different forms.' },
    { q: 'How do you apply different validators per field from a schema?', a: 'Inspect the schema in <code>buildForm()</code>: <code>if (field.required) validators.push(Validators.required); if (field.type === \'email\') validators.push(Validators.email)</code>. <code>Validators.compose(validators)</code> merges them.' },
    { q: 'How do you render different input types from the schema?', a: 'Use <code>@switch (field.type)</code> in the template with a <code>@case</code> per type: text, email, number, select, textarea, checkbox. Each case renders the appropriate <code>&lt;input&gt;</code> or <code>&lt;select&gt;</code> bound to <code>[formControlName]="field.key"</code>.' },
    { q: 'How do you type the FormGroup for a dynamic schema?', a: 'Use <code>Record&lt;string, unknown&gt;</code> for the builder group object. The resulting FormGroup is untyped but functional. For strong typing, generate a mapped type from the schema: <code>type FormModel = { [K in Schema[\'key\']: FormControl&lt;string&gt; }</code>.' },
    { q: 'How do you show a validation error for a dynamic field?', a: '<code>form.get(field.key)?.invalid && form.get(field.key)?.touched</code>. Or create a helper method: <code>isInvalid(key: string) { const c = this.form.get(key); return c?.invalid && c?.touched; }</code>.' },
    { q: 'What library handles complex dynamic forms in Angular?', a: 'Angular Formly (<code>@ngx-formly/core</code>) is the de-facto standard for complex schema-driven forms. It supports nested groups, conditional fields, custom field types, validation, and wrappers — all from a declarative config object.' },
  ];

  schema  = SCHEMA;
  form    = this.buildForm(SCHEMA);
  result  = signal<unknown>(null);

  private buildForm(schema: FieldConfig[]) {
    const group: Record<string, unknown> = {};
    for (const field of schema) {
      const validators = field.required ? [Validators.required] : [];
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
      heading: 'What are dynamic (schema-driven) forms?',
      points: [
        'Schema-driven forms build the form structure at runtime from a JSON/object config — no static template per field.',
        'A single template loop renders every field type by inspecting the schema config object.',
        'Backend can drive the form shape — great for CMS, survey builders, and admin UIs.',
        'The FormGroup is built programmatically from the same schema, keeping template and logic in sync.',
      ],
    },
    {
      heading: 'Implementation pattern',
      points: [
        'Define a FieldConfig interface: key, label, type, validators, options, placeholder.',
        'Use FormBuilder to iterate the schema and build FormControls with matching validators.',
        '@switch or @if in the template renders the correct input type for each field config.',
        'Pass the field\'s key to formControlName — the name matches the key in the dynamically built FormGroup.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Use Validators.compose() to merge multiple validators per field from the schema.',
        'Dynamic forms are harder to type-check — consider using typed FormGroup<...> with a mapped type.',
        'For extremely complex schemas look at Angular Formly library — it handles nested groups, conditionals, and custom field types.',
        'Cache the built FormGroup — do not rebuild on every render; rebuild only when the schema changes.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Schema definition',
      language: 'typescript',
      code: `interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

const SCHEMA: FieldConfig[] = [
  { key: 'name',  label: 'Name',  type: 'text',   required: true },
  { key: 'email', label: 'Email', type: 'email',  required: true },
  { key: 'role',  label: 'Role',  type: 'select',
    options: [{ label: 'Dev', value: 'dev' }, { label: 'PM', value: 'pm' }] },
];`,
    },
    {
      label: 'Build FormGroup',
      language: 'typescript',
      code: `private buildForm(schema: FieldConfig[]) {
  const group: Record<string, unknown> = {};
  for (const field of schema) {
    const validators = [];
    if (field.required) validators.push(Validators.required);
    if (field.type === 'email') validators.push(Validators.email);
    group[field.key] = [
      field.type === 'checkbox' ? false : '',
      validators,
    ];
  }
  return this.fb.group(group);
}`,
    },
    {
      label: 'Template loop',
      language: 'html',
      code: `@for (field of schema; track field.key) {
  <div class="field">
    <label>{{ field.label }}</label>
    @switch (field.type) {
      @case ('text')     { <input type="text"     [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
      @case ('email')    { <input type="email"    [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
      @case ('number')   { <input type="number"   [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" /> }
      @case ('textarea') { <textarea              [formControlName]="field.key" [placeholder]="field.placeholder ?? ''"></textarea> }
      @case ('checkbox') { <input type="checkbox" [formControlName]="field.key" /> }
      @case ('select')   {
        <select [formControlName]="field.key">
          @for (opt of field.options; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      }
    }
  </div>
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'In the `buildForm()` method, what initial value is assigned to a checkbox field when creating its FormControl?', options: ['An empty string \'\'', 'null', 'false', 'undefined'], answer: 2, explanation: 'The code uses `field.type === \'checkbox\' ? false : \'\'` — checkboxes start as boolean `false` while all other field types start as an empty string.' },
    { q: 'Which Angular directive connects the dynamically built FormGroup to the `<form>` element in the template?', options: ['[ngModel]', '[formGroup]', 'formGroupName', 'ngForm'], answer: 1, explanation: '`[formGroup]="form"` on the `<form>` element binds the programmatically created FormGroup to the template. `formGroupName` is used for nested groups, and `ngModel` belongs to template-driven forms.' },
    { q: 'In the template\'s `@for` loop, what value is passed to the `track` expression, and why is that the right choice?', options: ['`field.label`, because it is the human-readable name displayed to the user', '`field.type`, because it determines which input element is rendered', '`field.key`, because it is a unique identifier that also matches the FormGroup control name', '`$index`, because Angular requires numeric tracking for reactive forms'], answer: 2, explanation: '`field.key` is both unique per field and the same value used as `formControlName`, making it the ideal stable identity for DOM diffing. Using `$index` would cause unnecessary re-renders when the schema order changes.' },
    { q: 'What happens when `submit()` is called and `this.form.valid` is `false`?', options: ['The form is reset to its initial values', 'The result signal is set to an empty object', '`markAllAsTouched()` is called so validation errors become visible', 'A console error is thrown listing the invalid fields'], answer: 2, explanation: 'The `submit()` method calls `this.form.markAllAsTouched()` when the form is invalid. This triggers the `isInvalid()` checks in the template (which depend on `.touched`) to display error messages without actually submitting.' },
    { q: 'The `FieldConfig` interface marks `options` as optional. Which field type in the SCHEMA array actually uses the `options` property?', options: ['textarea', 'checkbox', 'number', 'select'], answer: 3, explanation: 'Only the `select` field type uses the `options` array (e.g., the `role` field with Developer / Designer / Manager options). The `@case (\'select\')` block in the template iterates `field.options` to render `<option>` elements.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormBuilder', type: 'class', desc: 'Service that creates FormGroup, FormControl, and FormArray instances with a concise builder API.' , since: '2'},
    { name: 'FormGroup', type: 'class', desc: 'Tracks the value and validity state of a group of FormControl instances, keyed by name.' , since: '2'},
    { name: 'FormControl', type: 'class', desc: 'Tracks the value and validation status of an individual form input element.' , since: '2'},
    { name: 'ReactiveFormsModule', type: 'class', desc: 'NgModule that exports reactive form directives such as formGroup, formControlName, and formArrayName.' , since: '2'},
    { name: 'Validators', type: 'class', desc: 'Provides a set of built-in validators (required, email, minLength, maxLength, pattern) that can be composed per field from a schema.' , since: '2'},
    { name: 'formControlName', type: 'directive', desc: 'Binds a FormControl registered in a parent FormGroup to a DOM input element using the control\'s string key.' , since: '2'},
    { name: 'formGroup', type: 'directive', desc: 'Binds a FormGroup instance to a <form> element, enabling reactive form directives inside it.' , since: '2'},
    { name: 'markAllAsTouched', type: 'function', desc: 'Marks all controls in a FormGroup (and nested groups) as touched, triggering validation error display without submitting.' , since: '8'},
    { name: 'Validators.compose', type: 'function', desc: 'Merges an array of validator functions into a single validator, used to apply multiple schema-driven validators to one control.' , since: '2'},
    { name: 'Record<string, unknown>', type: 'interface', desc: 'TypeScript utility type used to type the dynamic group object when building a FormGroup from a runtime schema.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Building a FormGroup: manual construction vs FormBuilder', before: '// Old: manually constructing controls\nconst group = new FormGroup({\n  name: new FormControl(\'\', Validators.required),\n  email: new FormControl(\'\', [Validators.required, Validators.email]),\n});', after: '// New: FormBuilder shorthand (less boilerplate)\nconst group = this.fb.group({\n  name: [\'\', Validators.required],\n  email: [\'\', [Validators.required, Validators.email]],\n});',
      note: 'FormBuilder.group() accepts [initialValue, validators] tuples, reducing noise when building groups programmatically from a schema loop.' },
    { title: 'Rendering field types: *ngSwitch vs @switch', before: '<!-- Old: structural directive syntax -->\n<ng-container [ngSwitch]="field.type">\n  <input *ngSwitchCase="\'text\'" [formControlName]="field.key" />\n  <input *ngSwitchCase="\'email\'" [formControlName]="field.key" />\n  <ng-container *ngSwitchDefault>...</ng-container>\n</ng-container>', after: '<!-- New: built-in control flow (Angular 17+) -->\n@switch (field.type) {\n  @case (\'text\')  { <input type=\'text\'  [formControlName]=\'field.key\' /> }\n  @case (\'email\') { <input type=\'email\' [formControlName]=\'field.key\' /> }\n  @default        { <textarea [formControlName]=\'field.key\'></textarea> }\n}',
      note: '@switch/@case is a native template syntax with no NgModule import needed and better type narrowing than ngSwitch.' },
    { title: 'Injecting services: constructor injection vs inject()', before: '// Old: constructor-based injection\nconstructor(private fb: FormBuilder) {}\n\nbuildForm() {\n  return this.fb.group({ name: [\'\'] });\n}', after: '// New: inject() function (Angular 14+)\nprivate fb = inject(FormBuilder);\n\nbuildForm() {\n  return this.fb.group({ name: [\'\'] });\n}',
      note: 'inject() works at field-initializer level, enabling cleaner class bodies without constructor boilerplate — also composable into helper functions.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Rebuilding the FormGroup on every render', wrong: '// Called in template or ngOnChanges without guard\nget form() {\n  return this.buildForm(this.schema);\n}', right: '// Build once, cache the result\nform = this.buildForm(this.schema);\n// Rebuild only when schema changes', explanation: 'Calling buildForm() inside a getter or on every change detection cycle destroys and recreates controls, losing user input and resetting validation state.'  },
    { title: 'Forgetting to import ReactiveFormsModule in standalone components', wrong: '@Component({\n  selector: \'app-form\',\n  template: \'<form [formGroup]="form">...</form>\',\n  // imports: [] — ReactiveFormsModule missing\n})', right: '@Component({\n  selector: \'app-form\',\n  imports: [ReactiveFormsModule],\n  template: \'<form [formGroup]="form">...</form>\',\n})', explanation: 'In standalone components, directives like formGroup and formControlName are not globally available — ReactiveFormsModule must be listed in the component\'s imports array.'  },
    { title: 'Using $index instead of a stable unique key in @for track', wrong: '@for (field of schema; track $index) {\n  <input [formControlName]=\'field.key\' />\n}', right: '@for (field of schema; track field.key) {\n  <input [formControlName]=\'field.key\' />\n}', explanation: 'Tracking by $index causes Angular to destroy and recreate DOM nodes when the schema order changes, resetting control values. field.key is stable and unique per field.'  },
    { title: 'Skipping markAllAsTouched on invalid submit', wrong: 'submit() {\n  if (this.form.valid) this.result = this.form.value;\n  // form invalid: nothing happens, errors stay hidden\n}', right: 'submit() {\n  if (this.form.valid) this.result = this.form.value;\n  else this.form.markAllAsTouched();\n}', explanation: 'Validation error messages conditioned on .touched stay hidden until the user interacts with each field. markAllAsTouched() forces all error spans visible on a failed submit attempt.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17', label: 'Built-in control flow in templates', features: ['@switch/@case replaces [ngSwitch]/*ngSwitchCase for rendering field types without NgModule imports', '@for with track replaces *ngFor, enforcing a stable tracking expression for performant list diffing', 'No CommonModule or NgSwitch import needed — syntax is built into the Angular compiler'] },
    { version: 'Angular 14', label: 'Strictly typed reactive forms', features: ['FormControl<T>, FormGroup<T>, and FormArray<T> carry generic type parameters for compile-time safety', 'Dynamic schemas can use FormGroup<Record<string, FormControl<string>>> or untyped FormGroup for flexibility', 'inject() function available as a constructor-free alternative to DI, usable at class field initializer level'] },
  ];

  challenge: Challenge = {
    title: 'Add a minLength validator to text fields',
    description: 'The current `buildForm()` function only applies `Validators.required` and `Validators.email`. Your task is to extend the `FieldConfig` interface to accept an optional `minLength` property, then update `buildForm()` to apply `Validators.minLength(field.minLength)` when that property is present. Finally, add a `minLength: 3` constraint to the `fullName` field in the schema and verify the error message shows when fewer than 3 characters are entered.',
    language: 'typescript',
    hints: [
      'Add `minLength?: number` to the `FieldConfig` interface — TypeScript will then allow you to set it in the schema array.',
      'Inside the `for` loop in `buildForm()`, check `if (field.minLength) validators.push(Validators.minLength(field.minLength));` after the existing validator checks.',
      'The `isInvalid()` helper returns true for ANY validation error on a touched control, so your existing error span will light up automatically — no template changes needed.',
      'To test, type 1-2 characters in the Full Name field and tab away — the red \'Full Name is required\' span should appear because the control is invalid (minLength not met) and touched.',
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
  { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
  { key: 'email',    label: 'Email',     type: 'email', placeholder: 'john@example.com', required: true },
  { key: 'age',      label: 'Age',       type: 'number', placeholder: '25' },
  { key: 'role',     label: 'Role',      type: 'select', required: true,
    options: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }] },
  { key: 'terms',    label: 'Accept terms', type: 'checkbox', required: true },
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
  options?: { label: string; value: string }[];
  minLength?: number; // NEW
}

const SCHEMA: FieldConfig[] = [
  { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, minLength: 3 }, // minLength added
  { key: 'email',    label: 'Email',     type: 'email', placeholder: 'john@example.com', required: true },
  { key: 'age',      label: 'Age',       type: 'number', placeholder: '25' },
  { key: 'role',     label: 'Role',      type: 'select', required: true,
    options: [{ label: 'Developer', value: 'dev' }, { label: 'Designer', value: 'design' }] },
  { key: 'terms',    label: 'Accept terms', type: 'checkbox', required: true },
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
}
