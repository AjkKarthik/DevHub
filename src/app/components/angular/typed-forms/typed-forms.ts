import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-typed-forms',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent, PrerequisitesComponent,
  ],
  templateUrl: './typed-forms.html',
  styleUrl: './typed-forms.scss',
})
export class TypedFormsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Forms: Template vs Reactive', route: '/angular/forms' },
    { label: 'FormArray',                   route: '/angular/form-array' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'FormControl<T>',               type: 'class',    desc: 'Typed form control — T is the value type; null is included unless NonNullable', since: 'Angular 14' },
    { name: 'FormGroup<T>',                 type: 'class',    desc: 'Typed form group — T maps control names to their AbstractControl types', since: 'Angular 14' },
    { name: 'FormArray<T>',                 type: 'class',    desc: 'Typed array of controls of uniform type T', since: 'Angular 14' },
    { name: 'FormRecord<T>',                type: 'class',    desc: 'Like FormGroup but for dynamic string keys — all values have the same control type', since: 'Angular 14' },
    { name: 'NonNullableFormBuilder',       type: 'class',    desc: 'All controls built with it default to nonNullable: true — no null on reset', since: 'Angular 14' },
    { name: 'fb.nonNullable',               type: 'accessor', desc: 'Shorthand on FormBuilder to get NonNullableFormBuilder', since: 'Angular 14' },
    { name: '.value',                       type: 'accessor', desc: 'Partial<T> — disabled controls are excluded from the type', since: 'Angular 14' },
    { name: '.getRawValue()',               type: 'method',   desc: 'Returns the full T including disabled control values — prefer for API submission', since: 'Angular 14' },
    { name: 'ɵValue<TControl>',            type: 'type',     desc: 'Utility type to extract the .value type from any AbstractControl', since: 'Angular 14' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why typed forms matter',
      points: [
        'Before Angular 14, all form controls had the type <code>AbstractControl</code> and <code>.value</code> was always <code>any</code>. This meant typos in field names, wrong value types, and missing null checks were all silent runtime bugs.',
        'Typed Reactive Forms infer the value type from the controls you pass into <code>FormGroup</code>, <code>FormArray</code>, and <code>FormRecord</code>. TypeScript now catches mismatches at compile time — <code>form.value.emaill</code> is an error, not just undefined.',
        'The types flow through <code>valueChanges</code>, <code>.value</code>, <code>getRawValue()</code>, and <code>patchValue()</code> — every interaction with the form is type-safe.',
        'The migration from untyped to typed forms is opt-in per control. Angular provides <code>UntypedFormControl</code>, <code>UntypedFormGroup</code>, etc. as aliases for the old behaviour, giving you a smooth upgrade path.',
      ],
    },
    {
      heading: 'FormControl<T | null> vs NonNullableFormBuilder',
      points: [
        'When you write <code>new FormControl(\'hello\')</code>, Angular infers the type as <code>FormControl&lt;string | null&gt;</code> — null is included because calling <code>.reset()</code> sets the value to null by default.',
        'To get <code>FormControl&lt;string&gt;</code> (no null), pass <code>{ nonNullable: true }</code>: <code>new FormControl(\'hello\', { nonNullable: true })</code>. On reset it uses the initial value instead of null.',
        '<code>NonNullableFormBuilder</code> (accessed as <code>fb.nonNullable</code>) builds all controls with <code>nonNullable: true</code> automatically — no need to repeat the option on every field.',
        'Best practice for most forms: use <code>fb.nonNullable.group({...})</code>. Your <code>.value</code> type will be <code>{ name: string; email: string }</code> instead of <code>{ name: string | null; email: string | null }</code>.',
      ],
    },
    {
      heading: '.value vs .getRawValue()',
      points: [
        '<code>.value</code> returns a <strong>partial type</strong> — disabled controls are excluded both at runtime and in the TypeScript type. This is a type-safety feature: if a control is disabled, its value may not reflect user input.',
        '<code>.getRawValue()</code> always returns the complete value including disabled controls, typed as the full non-partial shape. Use it when submitting the form to an API where you need all fields.',
        'A common mistake: using <code>form.value</code> for API submission when some controls are programmatically disabled. The payload will silently be missing those fields. Always use <code>getRawValue()</code> for submission.',
        'The distinction only matters when controls can be disabled. If all controls are always enabled, <code>.value</code> and <code>getRawValue()</code> return the same data at runtime — but <code>getRawValue()</code> gives a better TypeScript type.',
      ],
    },
    {
      heading: 'FormRecord<T> — dynamic key maps',
      points: [
        '<code>FormRecord&lt;FormControl&lt;string&gt;&gt;</code> is a typed <code>FormGroup</code> where the keys are dynamic strings and all values have the same control type. Use it for tag editors, permission checkboxes, multi-language inputs.',
        'Unlike <code>FormGroup</code>, <code>FormRecord</code> allows <code>addControl()</code> and <code>removeControl()</code> by string key without type errors — the key set is not fixed at compile time.',
        'The <code>.value</code> type is <code>{ [key: string]: T }</code>. You can iterate <code>Object.entries(form.value)</code> safely because all values have the same type T.',
      ],
    },
    {
      heading: 'Type narrowing with AbstractControl',
      points: [
        'When you have a reference typed as <code>AbstractControl</code>, use <code>instanceof FormControl</code>, <code>instanceof FormGroup</code>, or <code>instanceof FormArray</code> to narrow it before accessing typed properties.',
        'Utility functions like <code>function isFormGroup(c: AbstractControl): c is FormGroup { return c instanceof FormGroup; }</code> make narrowing reusable across your codebase.',
        'TypeScript type utilities: <code>ɵValue&lt;typeof control&gt;</code> extracts the value type from any control. This is an internal Angular type (ɵ prefix = internal) — prefer using the control type directly where possible.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'FormGroup<T> basics',
      language: 'typescript',
      code: `// ── Before typed forms (Angular 13 and earlier) ─────────────────────────────
const oldForm = new FormGroup({
  name:  new FormControl(''),
  email: new FormControl(''),
});
oldForm.value          // type: any — no help from TypeScript
oldForm.value.emaill   // no error — typo is silent

// ── After typed forms (Angular 14+) ──────────────────────────────────────────
const form = new FormGroup({
  name:  new FormControl('',    { nonNullable: true }),
  email: new FormControl('',    { nonNullable: true }),
  age:   new FormControl<number | null>(null),   // explicitly nullable
});

form.value          // type: { name: string; email: string; age: number | null }
form.value.emaill   // TS error: Property 'emaill' does not exist
form.value.email    // type: string (nonNullable) ✓

// ── NonNullableFormBuilder — cleaner syntax ────────────────────────────────
@Component({ ... })
export class ProfileComponent {
  constructor(private fb: FormBuilder) {}

  form = this.fb.nonNullable.group({
    firstName: [''],                    // FormControl<string>
    lastName:  [''],                    // FormControl<string>
    email:     ['', Validators.email],  // FormControl<string>
    role:      ['user' as const],       // FormControl<string>
  });

  // form.value type: { firstName: string; lastName: string; email: string; role: string }
}`,
    },
    {
      label: '.value vs getRawValue()',
      language: 'typescript',
      code: `@Component({ ... })
export class CheckoutComponent {
  form = this.fb.nonNullable.group({
    name:     [''],
    email:    [''],
    address:  [''],
    promoCode:[''],  // will be disabled unless user checks a box
  });

  applyPromo(checked: boolean) {
    if (checked) {
      this.form.controls.promoCode.enable();
    } else {
      this.form.controls.promoCode.disable();
    }
  }

  submit() {
    // ❌ form.value misses promoCode when it's disabled!
    // type: { name: string; email: string; address: string; promoCode?: string }
    //       promoCode is optional — might not be there
    console.log(this.form.value.promoCode);  // might be undefined

    // ✅ getRawValue() includes ALL controls including disabled ones
    // type: { name: string; email: string; address: string; promoCode: string }
    const payload = this.form.getRawValue();
    console.log(payload.promoCode);  // always a string ✓
    this.api.submitOrder(payload);
  }
}`,
    },
    {
      label: 'FormRecord<T> dynamic fields',
      language: 'typescript',
      code: `@Component({ ... })
export class PermissionsComponent {
  // FormRecord: dynamic keys, all values FormControl<boolean>
  permissions = new FormRecord<FormControl<boolean>>({});

  resources = signal(['orders', 'products', 'customers', 'reports']);

  constructor() {
    effect(() => {
      // Add a permission control for each resource
      for (const resource of this.resources()) {
        if (!this.permissions.controls[resource]) {
          this.permissions.addControl(
            resource,
            new FormControl(false, { nonNullable: true }),
          );
        }
      }
    });
  }

  save() {
    const perms = this.permissions.value;
    // type: { [key: string]: boolean }
    const granted = Object.entries(perms)
      .filter(([, allowed]) => allowed)
      .map(([key]) => key);
    console.log('Granted:', granted);
  }
}

// Multi-language input with FormRecord
type LangCode = 'en' | 'fr' | 'de';
const translations = new FormRecord<FormControl<string>>(
  Object.fromEntries(
    (['en', 'fr', 'de'] as LangCode[]).map(lang => [
      lang,
      new FormControl('', { nonNullable: true }),
    ]),
  )
);`,
    },
    {
      label: 'Nested typed groups & arrays',
      language: 'typescript',
      code: `// Address sub-group — extract type for reuse
type AddressGroup = FormGroup<{
  street: FormControl<string>;
  city:   FormControl<string>;
  zip:    FormControl<string>;
}>;

function buildAddressGroup(fb: FormBuilder): AddressGroup {
  return fb.nonNullable.group({
    street: [''],
    city:   [''],
    zip:    [''],
  }) as AddressGroup;
}

@Component({ ... })
export class OrderFormComponent {
  form = this.fb.nonNullable.group({
    customer: this.fb.nonNullable.group({
      name:  [''],
      email: [''],
    }),
    billing:  buildAddressGroup(this.fb),
    shipping: buildAddressGroup(this.fb),

    // Typed FormArray<FormControl<string>>
    tags: this.fb.array<FormControl<string>>([]),
  });

  // Access nested group — typed!
  get billing() { return this.form.controls.billing; }

  // billing.value.street — type: string ✓
  // billing.value.streetName — TS error ✓

  addTag(tag: string) {
    this.form.controls.tags.push(
      new FormControl(tag, { nonNullable: true }),
    );
  }

  submit() {
    const { customer, billing, shipping, tags } = this.form.getRawValue();
    // All types are inferred correctly — no any, no partial
    console.log(customer.email.toLowerCase());  // string ✓
  }

  constructor(private fb: FormBuilder) {}
}`,
    },
    {
      label: 'Type-safe valueChanges + AbstractControl narrowing',
      language: 'typescript',
      code: `@Component({ ... })
export class UserFormComponent {
  form = this.fb.nonNullable.group({
    username:  [''],
    email:     [''],
    role:      ['viewer' as 'viewer' | 'editor' | 'admin'],
  });

  constructor(private fb: FormBuilder, private destroyRef: DestroyRef) {
    // valueChanges is typed — no 'any'
    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => {
        // role: 'viewer' | 'editor' | 'admin' ✓
        if (role === 'admin') {
          this.showAdminWarning();
        }
      });

    // Typed patchValue — only valid keys accepted
    this.form.patchValue({
      username: 'alice',
      // unknownField: 'x',  // TS error ✓
    });
  }

  // AbstractControl narrowing
  printControlInfo(control: AbstractControl) {
    if (control instanceof FormControl) {
      console.log('FormControl value:', control.value);
    } else if (control instanceof FormGroup) {
      console.log('FormGroup keys:', Object.keys(control.controls));
    } else if (control instanceof FormArray) {
      console.log('FormArray length:', control.length);
    }
  }

  private showAdminWarning() { /* ... */ }
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Untyped FormGroup → Typed with NonNullableFormBuilder',
      language: 'typescript',
      before: `// Pre-Angular-14 — everything is AbstractControl / any
const form = new FormGroup({
  name:  new FormControl(''),
  email: new FormControl(''),
});

// .value is any — no compile-time safety
const name: string = form.value.name;     // 'any' silently assigned
const typo: string = form.value.naem;     // no error — undefined at runtime

// submit — has to handle possible nulls everywhere
const payload = { name: form.value.name || '', email: form.value.email || '' };`,
      after: `// Angular 14+ — types inferred, nonNullable prevents null on reset
form = this.fb.nonNullable.group({
  name:  [''],
  email: [''],
});

// .value is { name: string; email: string }
const name: string = this.form.value.name;    // type: string ✓
const typo          = this.form.value.naem;   // TS error ✓

// submit — use getRawValue() for full shape (handles disabled controls)
const payload = this.form.getRawValue();      // { name: string; email: string }`,
      note: 'The NonNullableFormBuilder fb.nonNullable removes null from all control types and changes reset() to restore to initial values instead of null.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using form.value for API submission when controls can be disabled',
      wrong: `// promoCode is disabled → not in form.value
this.api.createOrder(this.form.value);
// Submitted payload: { name, email } — promoCode silently missing!`,
      right: `// getRawValue() always includes all controls
this.api.createOrder(this.form.getRawValue());
// Submitted payload: { name, email, promoCode } ✓`,
      explanation: 'form.value excludes disabled controls — the TypeScript type even marks them as optional (promoCode?: string). getRawValue() always returns the full shape including disabled control values.',
    },
    {
      title: 'Not using NonNullable — fighting null everywhere',
      wrong: `form = this.fb.group({
  name:  [''],   // type: FormControl<string | null>
  email: [''],   // type: FormControl<string | null>
});

// valueChanges subscriber has to deal with null
this.form.controls.name.valueChanges.subscribe(name => {
  if (name !== null) { /* tedious null guard */ }
});`,
      right: `form = this.fb.nonNullable.group({
  name:  [''],   // type: FormControl<string> — no null!
  email: [''],   // type: FormControl<string>
});

// valueChanges is typed as string — no null guard needed
this.form.controls.name.valueChanges.subscribe(name => {
  doSomething(name.toLowerCase());  // name is string ✓
});`,
      explanation: 'New controls default to nullable because reset() sets value to null. Using NonNullableFormBuilder makes reset() use the initial value instead, eliminating null from control types.',
    },
    {
      title: 'Using FormGroup for dynamic keys — should be FormRecord',
      wrong: `// FormGroup with dynamic keys — TS errors on addControl/removeControl
const tags = new FormGroup<Record<string, FormControl<string>>>({});
tags.addControl('new-tag', new FormControl(''));  // type error`,
      right: `// FormRecord is designed for dynamic string keys
const tags = new FormRecord<FormControl<string>>({});
tags.addControl('new-tag', new FormControl('', { nonNullable: true }));  // ✓
tags.removeControl('old-tag');  // ✓`,
      explanation: 'FormGroup is for a fixed set of named controls. FormRecord is the typed equivalent of a dynamic dictionary — addControl() and removeControl() are properly typed to work with string keys.',
    },
    {
      title: 'Forgetting to export types for reuse across components',
      wrong: `// Recreating the same form shape in multiple components
// Component A:
formA = fb.nonNullable.group({ name: [''], email: [''] });

// Component B:
formB = fb.nonNullable.group({ name: [''], email: [''] });
// No shared type — copy-paste drift accumulates`,
      right: `// models/user-form.ts
export type UserFormGroup = FormGroup<{
  name:  FormControl<string>;
  email: FormControl<string>;
}>;
export type UserFormValue = UserFormGroup['value'];

// component-a.ts / component-b.ts — single source of truth
form: UserFormGroup = this.fb.nonNullable.group({ name: [''], email: [''] });`,
      explanation: 'Extract FormGroup types to a shared model file. This ensures the submitted payload type, the valueChanges subscriber type, and the patch type all stay in sync automatically.',
    },
    {
      title: 'Using form.get("path") instead of form.controls.field',
      wrong: `// form.get() returns AbstractControl | null — type information lost
const emailControl = this.form.get('email');  // AbstractControl | null
emailControl?.value;   // type: any — no TypeScript help`,
      right: `// form.controls.field preserves the type
const emailControl = this.form.controls.email;  // FormControl<string>
emailControl.value;   // type: string ✓

// If you must use get(), cast it:
const email = this.form.get('email') as FormControl<string>;`,
      explanation: 'form.get("path") returns AbstractControl | null and loses all type information. Use form.controls.fieldName for typed access. Keep form.get() only for dynamic path strings or legacy code.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a fully typed registration form',
    language: 'typescript',
    description: `Create a typed registration form with NonNullableFormBuilder that has:
1. Required fields: username (string), email (string), password (string)
2. Optional promo code field (string | null) — starts disabled, enabled when a checkbox is checked
3. A tags FormRecord<FormControl<string>> for dynamic skill tags
4. A submit handler that uses getRawValue() and logs the full payload with correct types`,
    hints: [
      'Use this.fb.nonNullable.group({}) for the main form',
      'For the nullable promo code: new FormControl<string | null>(null)',
      'Start promoCode disabled: this.form.controls.promoCode.disable()',
      'Enable/disable on checkbox: form.controls.promoCode.enable() / .disable()',
      'FormRecord for tags: new FormRecord<FormControl<string>>({})',
      'getRawValue() returns the full shape including the disabled promoCode',
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <!-- TODO: username, email, password fields -->
      <!-- TODO: promo code checkbox + input (disable/enable on checkbox change) -->
      <!-- TODO: tags section with add/remove -->
      <button type="submit">Register</button>
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);

  // TODO: define typed form with NonNullableFormBuilder
  // TODO: define FormRecord for tags
}`,
    solution: `import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Username <input formControlName="username" /></label>
      <label>Email    <input formControlName="email" type="email" /></label>
      <label>Password <input formControlName="password" type="password" /></label>

      <label>
        <input type="checkbox" (change)="togglePromo($event)" />
        Have a promo code?
      </label>
      <input formControlName="promoCode" placeholder="PROMO" />

      <div [formGroup]="tags">
        @for (key of tagKeys; track key) {
          <label>{{ key }} <input [formControlName]="key" /></label>
        }
      </div>
      <button type="button" (click)="addTag()">+ Add Skill</button>
      <button type="submit">Register</button>
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  \`,
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    username:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', Validators.minLength(8)],
    promoCode: new FormControl<string | null>(null),
  });

  tags = new FormRecord<FormControl<string>>({});
  tagKeys: string[] = [];
  private tagCounter = 0;

  constructor() {
    this.form.controls.promoCode.disable();
  }

  togglePromo(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.form.controls.promoCode.enable();
    } else {
      this.form.controls.promoCode.disable();
    }
  }

  addTag() {
    const key = \`skill_\${++this.tagCounter}\`;
    this.tags.addControl(key, new FormControl('', { nonNullable: true }));
    this.tagKeys.push(key);
  }

  submit() {
    const payload = this.form.getRawValue();
    // { username: string, email: string, password: string, promoCode: string | null }
    console.log('Payload:', payload);
    console.log('Tags:', this.tags.value);
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What type does new FormControl("hello") produce in Angular 14+?',
      options: [
        'FormControl<string>',
        'FormControl<string | null>',
        'AbstractControl',
        'FormControl<any>',
      ],
      answer: 1,
      explanation: 'By default, FormControl infers FormControl<string | null> because reset() sets the value to null. To get FormControl<string> you must pass { nonNullable: true } or use NonNullableFormBuilder.',
    },
    {
      q: 'When should you use getRawValue() instead of .value?',
      options: [
        'getRawValue() returns a deep clone — use it when you need immutability',
        'When any controls could be disabled — .value excludes them, getRawValue() includes them',
        'getRawValue() is faster — use it for performance',
        'getRawValue() is only for FormArray, not FormGroup',
      ],
      answer: 1,
      explanation: '.value is a partial type that excludes disabled controls from both the runtime value and the TypeScript type. getRawValue() always returns all controls including disabled ones — use it for API submission.',
    },
    {
      q: 'What is FormRecord<T> used for?',
      options: [
        'A read-only view of a FormGroup',
        'A FormGroup with dynamic string keys where all values have the same control type',
        'A FormArray where each item is a typed object',
        'An alternative to FormBuilder for creating controls',
      ],
      answer: 1,
      explanation: 'FormRecord<FormControl<boolean>> is like FormGroup but for dynamic key sets — all values have the same type. Use it for permission checkboxes, tag maps, or multi-language inputs where keys are added/removed at runtime.',
    },
    {
      q: 'How does NonNullableFormBuilder change reset() behaviour?',
      options: [
        'reset() is disabled — you must call patchValue() instead',
        'reset() uses each control\'s initial value instead of setting to null',
        'reset() throws if called — use form.setValue() to reset',
        'No change — NonNullableFormBuilder only affects TypeScript types',
      ],
      answer: 1,
      explanation: 'With nonNullable: true (or NonNullableFormBuilder), reset() restores controls to their initial value instead of null. This eliminates null from the control type entirely.',
    },
    {
      q: 'What does form.controls.email give you compared to form.get("email")?',
      options: [
        'They are identical — both return FormControl<string>',
        'form.controls.email is typed (FormControl<string>); form.get("email") returns AbstractControl | null',
        'form.get("email") is typed; form.controls.email is not',
        'Both return AbstractControl — you must always cast to FormControl',
      ],
      answer: 1,
      explanation: 'form.controls.field preserves the specific control type from the FormGroup definition. form.get("path") always returns AbstractControl | null, losing the type. Prefer form.controls.field for typed access.',
    },
    {
      q: 'You have a form with a disabled promoCode control. What is the TypeScript type of form.value.promoCode?',
      options: [
        'string — the disable/enable state does not affect the type',
        'string | undefined — disabled controls are optional in the .value type',
        'null — disabled controls are reset to null',
        'never — TypeScript does not allow accessing disabled control values via .value',
      ],
      answer: 1,
      explanation: "Angular's typed forms make .value a Partial type — disabled controls become optional (promoCode?: string). At runtime the value is undefined if the control is disabled. Use getRawValue() to always get the value regardless of disabled state.",
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I migrate an existing UntypedFormGroup to a typed FormGroup?',
      a: 'Angular provides UntypedFormControl, UntypedFormGroup, UntypedFormArray, and UntypedFormBuilder as exact aliases for the Angular 13 untyped behaviour. Step 1: Run ng update @angular/core which automatically renames FormControl → UntypedFormControl etc. in your existing code. Step 2: Gradually change UntypedFormGroup back to typed FormGroup one form at a time, adding nonNullable: true and fixing the resulting TypeScript errors. This keeps the app running throughout.',
    },
    {
      q: 'How do I type a nested FormGroup correctly?',
      a: 'Define a type alias for the nested group shape: type AddressGroup = FormGroup<{ street: FormControl<string>; city: FormControl<string> }>. Then use it as a function return type or property type. When using fb.nonNullable.group() the type is inferred but Angular sometimes widens it — explicit type aliases prevent this drift and make the shape reusable across components and services.',
    },
    {
      q: 'Can I use typed forms with template-driven forms?',
      a: 'No — typed Reactive Forms is exclusively for the reactive forms API (FormControl, FormGroup, FormBuilder). Template-driven forms use NgModel which still produces any typed values. If type safety matters, use reactive forms. Template-driven forms remain useful for simple scenarios where TypeScript strictness is not a priority.',
    },
    {
      q: 'How do I get the type of a form\'s value without declaring it separately?',
      a: 'Use typeof and the control type: type FormValue = ReturnType<typeof this.form.getRawValue>. Angular also exports ɵValue<TControl> (internal utility type) — use it carefully since internal APIs can change. The safest approach is to define the type explicitly or extract it from the FormGroup type parameter.',
    },
    {
      q: 'What happens to the type of valueChanges on a typed FormControl?',
      a: 'valueChanges is typed as Observable<T> where T is the control\'s value type including null if nullable. For a FormControl<string | null>, valueChanges is Observable<string | null>. For a nonNullable FormControl<string>, valueChanges is Observable<string>. This means switchMap, map, and subscribe callbacks all receive correctly typed values.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular 14+ typed forms infer value types from control declarations, making <code>.value</code>, <code>valueChanges</code>, and <code>patchValue()</code> fully type-safe — <code>NonNullableFormBuilder</code> removes null from the types by making <code>reset()</code> restore initial values.',
    mustKnow: [
      '<code>new FormControl("")</code> → <code>FormControl&lt;string | null&gt;</code>; add <code>{ nonNullable: true }</code> or use <code>fb.nonNullable.group()</code> to remove null',
      '<code>.value</code> is partial — disabled controls are optional/excluded; <code>.getRawValue()</code> includes all controls — <strong>always use for API submission</strong>',
      '<code>FormRecord&lt;FormControl&lt;T&gt;&gt;</code> for dynamic string keys — <code>addControl()</code> and <code>removeControl()</code> by string key',
      '<code>form.controls.field</code> is typed; <code>form.get("field")</code> returns <code>AbstractControl | null</code>',
      '<code>valueChanges</code> is <code>Observable&lt;T&gt;</code> — fully typed, no any',
      'Export <code>FormGroup&lt;...&gt;</code> type aliases for reuse across components',
    ],
    interviewFocus: [
      '<strong>.value vs getRawValue()?</strong> — .value is partial (disabled excluded); getRawValue() includes all',
      '<strong>Why NonNullableFormBuilder?</strong> — removes null from types, reset() uses initial value',
      '<strong>FormRecord vs FormGroup?</strong> — FormRecord for dynamic keys; FormGroup for fixed schema',
      '<strong>How to migrate?</strong> — ng update renames to UntypedForm*, then incrementally type one form at a time',
    ],
  };
}
