import { Component, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { JsonPipe, TitleCasePipe } from '@angular/common';
import { z } from 'zod';
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

// --- Zod schemas (single source of truth) ---
const signupSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  age:      z.coerce.number().min(18, 'Must be 18+').max(120, 'Invalid age'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/\d/, 'At least one number'),
  confirm:  z.string(),
}).refine(data => data.password === data.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type SignupForm = z.infer<typeof signupSchema>;

// Zod-powered Angular validator factory
function zodValidator(schema: z.ZodSchema) {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = schema.safeParse(control.value);
    return result.success ? null : { zod: result.error.issues[0].message };
  };
}

const productSchema = z.object({
  title:    z.string().min(3, 'Title must be at least 3 characters'),
  price:    z.coerce.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'books', 'food']),
  inStock:  z.boolean(),
  tags:     z.array(z.string()).min(1, 'Add at least one tag'),
});

type Product = z.infer<typeof productSchema>;

@Component({
  selector: 'app-zod-forms',
  imports: [ReactiveFormsModule, JsonPipe, TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './zod-forms.html',
  styleUrl: './zod-forms.scss',
})
export class ZodFormsDemo {
  private fb = inject(FormBuilder);

  // --- Signup form ---
  signupForm = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    age:      [null as number | null, [Validators.required, Validators.min(18)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm:  ['', Validators.required],
  });

  signupResult  = signal<SignupForm | null>(null);
  signupErrors  = signal<z.ZodError | null>(null);
  showPassword  = signal(false);

  submitSignup() {
    const raw    = this.signupForm.value;
    const result = signupSchema.safeParse(raw);
    if (result.success) {
      this.signupResult.set(result.data);
      this.signupErrors.set(null);
    } else {
      this.signupErrors.set(result.error);
      this.signupResult.set(null);
    }
  }

  getZodError(field: keyof SignupForm): string {
    const err = this.signupErrors();
    if (!err) return '';
    const issue = err.issues.find(i => i.path[0] === field);
    return issue?.message ?? '';
  }

  // --- Product form ---
  productForm = this.fb.group({
    title:    ['', Validators.required],
    price:    [null as number | null, Validators.required],
    category: ['electronics' as Product['category']],
    inStock:  [true],
    tags:     [''],
  });

  productResult  = signal<Product | null>(null);
  productErrors  = signal<string[]>([]);
  categories     = ['electronics', 'clothing', 'books', 'food'] as const;

  submitProduct() {
    const raw    = this.productForm.value;
    const parsed = {
      ...raw,
      tags: (raw.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    const result = productSchema.safeParse(parsed);
    if (result.success) {
      this.productResult.set(result.data);
      this.productErrors.set([]);
    } else {
      this.productErrors.set(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
      this.productResult.set(null);
    }
  }

  // --- Live field validation ---
  liveEmail    = signal('');
  emailResult  = computed(() => {
    const r = z.string().email().safeParse(this.liveEmail());
    return r.success ? '✅ Valid email' : `❌ ${r.error.issues[0].message}`;
  });

  liveNumber   = signal('');
  numberResult = computed(() => {
    const r = z.coerce.number().min(0).max(100).safeParse(this.liveNumber());
    return r.success ? `✅ Valid: ${r.data}` : `❌ ${r.error.issues[0].message}`;
  });

  prerequisites: Prerequisite[] = [
    { label: 'Forms (Reactive & Template)', route: '/angular/forms-demo' },
    { label: 'Custom Validators', route: '/angular/custom-validators' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'What is Zod?',
    points: [
      'Zod is a TypeScript-first runtime schema validation library — you define schemas using a fluent builder API, and it infers the TypeScript type automatically using <code>z.infer&lt;typeof mySchema&gt;</code>.',
      '<code>z.safeParse(data)</code> never throws — it returns <code>{ success: true, data }</code> or <code>{ success: false, error: ZodError }</code>. <code>z.parse(data)</code> throws on failure — always use <code>safeParse</code> for user input.',
      'Schemas validate at runtime while TypeScript types check at compile time. Zod bridges both layers: the same schema definition drives Angular\'s form validators and TypeScript\'s type system.',
      'Zod\'s bundle size is ~14 kB gzipped — acceptable for most Angular applications. Alternatives: Yup (older), Valibot (smaller, similar API), Arktype (even faster).',
      'Use Zod everywhere a contract matters: form submission, API responses, environment variables, query parameters, localStorage values — any boundary where external data enters your app.',
    ],
  },
  {
    heading: 'Zod + Reactive Forms integration strategies',
    points: [
      '<strong>Strategy 1 — Submit-time Zod:</strong> use Angular\'s built-in validators for instant UI feedback, then run <code>schema.safeParse(form.value)</code> on submit for full schema enforcement and a typed result.',
      '<strong>Strategy 2 — Zod-powered Angular validators:</strong> create a <code>zodValidator(schema)</code> factory that wraps <code>safeParse</code> and returns <code>ValidationErrors | null</code> — applied directly to <code>FormControl</code> definitions.',
      '<strong>Strategy 3 — Schema-only on submit:</strong> skip Angular validators entirely; rely purely on Zod on submit. Simpler setup, but loses real-time field-level feedback.',
      'Use <code>z.infer&lt;typeof schema&gt;</code> to derive the TypeScript type. The typed result from <code>safeParse(...).data</code> carries the exact type, so you get autocomplete on the submitted payload without a separate interface.',
      'Pre-process form values before parsing: <code>z.coerce.number()</code> handles string-to-number conversion; for arrays represented as comma-separated strings, split before calling <code>safeParse</code>.',
    ],
  },
  {
    heading: 'The zodValidator factory pattern',
    points: [
      'A <code>zodValidator</code> factory converts any Zod schema into an Angular <code>ValidatorFn</code>: <code>(ctrl: AbstractControl) => ValidationErrors | null</code> — a reusable bridge with zero Zod-specific code in your form setup.',
      'Return format: <code>{ zod: errorMessage }</code> on failure, <code>null</code> on success. Access in the template with <code>control.errors?.[\'zod\']</code> for a clean, single-key error convention.',
      'Field-level usage: <code>email: [\'\', zodValidator(z.string().email(\'Invalid email\'))]</code>. The Angular validator fires on every value change, just like a built-in validator.',
      'For cross-field rules, attach the <code>zodValidator</code> at the group level: <code>this.fb.group({...}, { validators: zodValidator(myFullSchema) })</code> — the group validator receives the whole <code>FormGroup</code>.',
      'Compose with built-in validators: <code>[Validators.required, zodValidator(z.string().url())]</code>. Angular runs them in order — <code>Validators.required</code> blocks empty strings before Zod runs its URL check.',
    ],
  },
  {
    heading: 'Cross-field validation with .refine() and .superRefine()',
    points: [
      '<code>.refine(fn, opts)</code> attaches a custom validation function to a Zod schema. Returns <code>true</code> for valid, <code>false</code> for invalid. The <code>message</code> option sets the error text.',
      'Place <code>.refine()</code> at the object level for cross-field rules: <code>z.object({ pass, confirm }).refine(d => d.pass === d.confirm, { message: \'Passwords must match\', path: [\'confirm\'] })</code>.',
      'Without <code>path</code>, cross-field errors land at <code>path: []</code> (the root object) — <code>getZodError(\'confirm\')</code> won\'t find them. Always set <code>path</code> on cross-field refinements.',
      '<code>.superRefine((data, ctx) => { ctx.addIssue({...}) })</code> allows adding multiple issues in one call — useful when a cross-field rule can fail in several independent ways.',
      'Async refinements: <code>.refine(async val => await checkUnique(val), { message: \'Username taken\' })</code>. Use <code>safeParseAsync()</code> to evaluate them.',
    ],
  },
  {
    heading: 'Runtime API response validation',
    points: [
      'Define a Zod schema that matches your API\'s expected response shape. On every HTTP call, run <code>schema.safeParse(response)</code> — if it fails, you\'ve caught backend contract drift before it causes a runtime error.',
      'In Angular HttpClient, pipe the response through a Zod parse: <code>this.http.get(\'/api/users\').pipe(map(data => { const r = schema.safeParse(data); if (!r.success) throw new Error(\'API mismatch\'); return r.data; }))</code>.',
      '<code>z.array(userSchema)</code> validates list responses. Combine with <code>.nullable()</code> or <code>.optional()</code> to handle fields the backend might return as null.',
      'In production, use <code>safeParse</code> (not <code>parse</code>) in HTTP interceptors — a <code>ZodError</code> thrown mid-request is an uncaught error if not handled. Log <code>error.issues</code> for observability.',
      'Versioned API schemas: use Zod\'s discriminated unions (<code>z.discriminatedUnion(\'version\', [...])</code>) to handle multiple API response shapes based on a version discriminant field.',
    ],
  },
  {
    heading: 'Best practices',
    points: [
      'Place Zod schemas in a <code>schemas/</code> folder (or colocated with the feature) as <code>const</code>s — not class methods. They are pure data and should be reusable across components, services, and tests.',
      'Use <code>z.string().trim()</code> or <code>.toLowerCase()</code> as transforms to normalise input before storing. The parsed output is the normalised value — not the raw string.',
      'In tests, call <code>schema.parse(testData)</code> directly without Angular — Zod schemas are plain TypeScript and require no testing framework setup. Schema unit tests are fast and isolated.',
      'For Zod validation at app startup, parse <code>environment</code> through a config schema in <code>APP_INITIALIZER</code> — if it fails, log and throw to prevent the app from running with missing env vars.',
      'Prefer <code>z.object().strict()</code> for API response validation to catch extra unexpected fields, but avoid it for form values where Angular adds control metadata to the value object.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the difference between z.parse() and z.safeParse()?', a: '<code>z.parse()</code> throws a <code>ZodError</code> on invalid input. <code>z.safeParse()</code> never throws — it returns <code>{ success: true, data }</code> or <code>{ success: false, error }</code>. Always use <code>safeParse</code> for user input validation.' },
    { q: 'How do you derive a TypeScript type from a Zod schema?', a: '<code>type User = z.infer&lt;typeof userSchema&gt;</code>. This gives you compile-time safety from the same schema that validates at runtime — one source of truth for both type and validation.' },
    { q: 'How do you validate an API response with Zod?', a: '<code>const result = userSchema.safeParse(await res.json())</code>. If <code>result.success</code> is false, the API returned unexpected data — log the error and handle gracefully. This catches contract drift between frontend and backend.' },
    { q: 'How do you add a custom Zod validator?', a: '<code>z.string().refine(val => val.startsWith(\'@\'), { message: \'Must start with @\' })</code>. For async: <code>.refine(async val => await checkUnique(val), { message: \'Already taken\' })</code>. Use <code>.superRefine()</code> for multiple errors.' },
    { q: 'How do cross-field validations work in Zod?', a: 'Apply a validator at the object level: <code>z.object({ pass: z.string(), confirm: z.string() }).refine(d => d.pass === d.confirm, { message: \'Passwords must match\', path: [\'confirm\'] })</code>. The <code>path</code> assigns the error to a specific field.' },
    { q: 'Can Zod replace Angular Validators entirely?', a: 'In practice, use both: Angular Validators for synchronous UI feedback, Zod for full schema validation on submit and for validating API responses. A Zod-to-Angular adapter is not built-in — you call <code>safeParse</code> manually in the submit handler.' },
    { q: 'How do you validate arrays of items from an API response — e.g. a list of users?', a: 'Use <code>z.array(itemSchema)</code>: <code>const usersSchema = z.array(userSchema)</code>. Then call <code>usersSchema.safeParse(responseData)</code>. The result\'s <code>data</code> is typed as <code>User[]</code>. For empty-allowed vs non-empty lists, chain <code>.min(1)</code> or <code>.nonempty()</code> on the array schema.' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema definition',
      language: 'typescript',
      code: `import { z } from 'zod';

// Define schema — single source of truth
const signupSchema = z.object({
  name:     z.string().min(2, 'At least 2 chars'),
  email:    z.string().email('Invalid email'),
  age:      z.coerce.number().min(18, 'Must be 18+'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/\\d/, 'At least one number'),
  confirm:  z.string(),
}).refine(
  data => data.password === data.confirm,
  { message: 'Passwords do not match', path: ['confirm'] }
);

// Derive TypeScript type from schema (no duplication!)
type SignupForm = z.infer<typeof signupSchema>;

// Validate at runtime:
const result = signupSchema.safeParse(formData);
if (result.success) {
  // result.data is fully typed as SignupForm
} else {
  // result.error.issues[0].message
}`,
    },
    {
      label: 'Angular integration',
      language: 'typescript',
      code: `// Custom Angular validator using a Zod schema
function zodValidator(schema: z.ZodSchema) {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = schema.safeParse(control.value);
    return result.success
      ? null
      : { zod: result.error.issues[0].message };
  };
}

// In reactive form:
this.form = this.fb.group({
  email: ['', [Validators.required, zodValidator(z.string().email())]],
  age:   [null, [zodValidator(z.coerce.number().min(18))]],
});

// In template:
// <div *ngIf="form.get('email')?.errors?.['zod'] as err">{{ err }}</div>

// Or validate the entire form on submit:
submitHandler() {
  const result = mySchema.safeParse(this.form.value);
  if (!result.success) {
    // result.error.issues — array of validation failures
    result.error.issues.forEach(issue => console.error(issue));
  }
}`,
    },
    {
      label: 'Common Zod patterns',
      language: 'typescript',
      code: `// Primitives
z.string()         // any string
z.number()         // any number
z.boolean()
z.date()
z.coerce.number()  // auto-converts "42" → 42

// String refinements
z.string().min(3).max(100).trim().toLowerCase()
z.string().email().url().uuid().regex(/pattern/)
z.string().startsWith('https').endsWith('.com')

// Number refinements
z.number().positive().negative().nonnegative()
z.number().int().min(0).max(999)
z.number().multipleOf(5)

// Arrays
z.array(z.string()).min(1).max(10).nonempty()

// Enums
z.enum(['small', 'medium', 'large'])

// Optional / nullable
z.string().optional()   // string | undefined
z.string().nullable()   // string | null
z.string().nullish()    // string | null | undefined

// Objects
z.object({ key: z.string() }).strict()  // no extra keys
z.object({ a: z.string(), b: z.number() }).partial()  // all optional
z.object({ a: z.string() }).pick({ a: true })
z.object({ a: z.string(), b: z.number() }).omit({ b: true })`,
    },
    {
      label: 'API response validation',
      language: 'typescript',
      code: `// Validate API responses at runtime — catch backend inconsistencies early

const userSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  email:     z.string().email(),
  role:      z.enum(['admin', 'user', 'guest']),
  createdAt: z.string().datetime(),
});

const usersListSchema = z.array(userSchema);

// In a service:
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get('/api/users').pipe(
      map(data => {
        const result = usersListSchema.safeParse(data);
        if (!result.success) {
          console.error('API schema mismatch:', result.error.issues);
          throw new Error('Invalid API response');
        }
        return result.data; // typed as z.infer<typeof usersListSchema>
      })
    );
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does `z.safeParse()` return when validation fails?', options: ['It throws a ZodError with all issues listed', 'An object with `{ success: false, error: ZodError }`', 'An object with `{ success: false, message: string }`', 'null'], answer: 1, explanation: 'Unlike `z.parse()` which throws, `z.safeParse()` always returns an object. On failure it returns `{ success: false, error }` where `error` is a ZodError containing an `issues` array — making it safe to use for user input without a try/catch.' },
    { q: 'Given `const signupSchema = z.object({ name: z.string() })`, how do you derive its TypeScript type without writing a separate interface?', options: ['type SignupForm = z.typeof(signupSchema)', 'type SignupForm = z.extract<typeof signupSchema>', 'type SignupForm = z.infer<typeof signupSchema>', 'type SignupForm = ReturnType<typeof signupSchema.parse>'], answer: 2, explanation: '`z.infer<typeof mySchema>` extracts the TypeScript type that the schema describes at compile time. This is the \'single source of truth\' pattern — your runtime validation schema and your compile-time type are kept in sync automatically.' },
    { q: 'In the `zodValidator` factory function, what does it return when `schema.safeParse(control.value)` succeeds?', options: ['An empty object `{}`', '`{ valid: true }`', 'The parsed data object', 'null'], answer: 3, explanation: 'Angular\'s validator contract requires returning `null` when a control is valid, or a `ValidationErrors` object when it is invalid. The `zodValidator` factory returns `null` on success and `{ zod: result.error.issues[0].message }` on failure.' },
    { q: 'How does the product form handle the `tags` field, which is stored as a comma-separated string in the form control but needs to be a `string[]` for Zod validation?', options: ['It uses `z.coerce.array()` to automatically convert the string', 'It splits the raw string by comma, trims each entry, and filters empty strings before calling `safeParse`', 'It defines the Zod schema field as `z.string()` and then transforms it after validation', 'It uses a custom Angular `ControlValueAccessor` to convert the value'], answer: 1, explanation: 'In `submitProduct()`, the raw form value is spread and the `tags` field is transformed: `tags: (raw.tags as string).split(\',\').map(t => t.trim()).filter(Boolean)`. This pre-processing happens before `productSchema.safeParse(parsed)` is called, adapting the UI representation to the schema\'s expected shape.' },
    { q: 'The `signupSchema` uses `.refine()` at the object level to check that `password === confirm`. Why is the `path: [\'confirm\']` option important?', options: ['It tells Zod which field to validate first', 'It is required syntax — `.refine()` will throw without a path', 'It assigns the cross-field error to the `confirm` field so `getZodError(\'confirm\')` can surface it', 'It prevents Zod from running the refinement when `confirm` is empty'], answer: 2, explanation: 'When a `.refine()` is placed on the whole object, its error would normally have an empty path `[]`. By setting `path: [\'confirm\']`, the error issue\'s `path[0]` becomes `\'confirm\'`, so the `getZodError(\'confirm\')` helper — which searches `err.issues` by `path[0]` — can find and display it next to the confirm field.' },
    { q: 'An HTML `<input type="number">` still yields a string in a reactive form. Which Zod schema correctly validates it as a number with a minimum of 18?', options: ['`z.number().min(18)` — Zod automatically coerces HTML input values', '`z.string().min(18)` — min() works on string length and numeric value alike', '`z.coerce.number().min(18)` — coerce converts the string before the min() check runs', '`z.literal(18)` — literal is the only type that accepts both strings and numbers'], answer: 2, explanation: '`z.number()` strictly expects a JavaScript number and fails when given the string `\'25\'`. `z.coerce.number()` runs `Number(value)` before validation, converting `\'25\'` to `25` and then applying the `min(18)` check. Always use `z.coerce.number()` for reactive form number controls.' },
    { q: 'What does `type SignupForm = z.infer<typeof signupSchema>` accomplish compared to writing a separate `interface SignupForm`?', options: ['Nothing — z.infer is purely decorative and produces the `any` type', 'It derives the TypeScript type from the schema at compile time, staying automatically in sync as the schema changes', 'It generates a runtime class that can be instantiated with `new SignupForm()`', 'It is a Zod-specific type that cannot be used outside of Zod utility functions'], answer: 1, explanation: '`z.infer<typeof schema>` is a TypeScript compile-time operation that extracts the exact static type described by the schema. If you add a new required field to the schema, the inferred type updates automatically — no separate interface to maintain. This single-source-of-truth pattern eliminates drift between runtime validation and compile-time types.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'z.object()', type: 'function', desc: 'Defines a Zod schema for a plain object, mapping field names to their Zod validators — the foundation of form schema definitions.' , since: '3'},
    { name: 'z.infer', type: 'operator', desc: 'TypeScript utility type that extracts the static type from a Zod schema, eliminating the need for a separate interface definition.' , since: '3'},
    { name: 'safeParse()', type: 'function', desc: 'Validates data against a Zod schema without throwing — returns { success: true, data } on success or { success: false, error: ZodError } on failure.' , since: '3'},
    { name: 'z.coerce', type: 'function', desc: 'Namespace of Zod validators that automatically coerce input types before validating, e.g. z.coerce.number() converts the string \'42\' to the number 42.' , since: '3'},
    { name: '.refine()', type: 'function', desc: 'Attaches a custom cross-field or complex validation function to a Zod schema; use the path option to assign the error to a specific field.' , since: '3'},
    { name: 'ZodError.issues', type: 'class', desc: 'Array of ZodIssue objects on a failed parse result, each containing a path array and a message string describing the validation failure.' },
    { name: 'zodValidator()', type: 'function', desc: 'Angular validator factory pattern that wraps a Zod schema call to produce a standard Angular ValidationErrors object compatible with reactive forms.' },
    { name: 'z.enum()', type: 'function', desc: 'Creates a Zod schema that only accepts one of a fixed set of string literals, with full TypeScript union-type inference.' , since: '3'},
    { name: '.optional() / .nullable() / .nullish()', type: 'function', desc: 'Modifier methods that widen a Zod schema to also accept undefined, null, or both — essential for optional form fields.' , since: '3'},
    { name: 'AbstractControl / ValidationErrors', type: 'interface', desc: 'Angular reactive-forms types used when writing custom validators; a validator returns null for valid or a ValidationErrors object for invalid.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Duplicate type + manual validation vs. Zod single source of truth', before: '// Old: define interface AND write manual validator separately\ninterface SignupForm { name: string; email: string; age: number; }\nfunction validate(data: SignupForm) {\n  if (!data.email.includes(\'@\')) throw new Error(\'Bad email\');\n  if (data.age < 18) throw new Error(\'Must be 18+\');\n}', after: '// New: schema IS the type — one definition for both\nconst signupSchema = z.object({\n  email: z.string().email(\'Invalid email\'),\n  age:   z.coerce.number().min(18, \'Must be 18+\'),\n});\ntype SignupForm = z.infer<typeof signupSchema>;\nconst result = signupSchema.safeParse(formData);',
      note: 'z.infer eliminates the separate interface; safeParse replaces manual if-chains.' },
    { title: 'try/catch parse vs. safeParse for user input', before: '// Old: z.parse() throws — needs try/catch for every submit\nsubmitHandler() {\n  try {\n    const data = schema.parse(this.form.value);\n    this.result.set(data);\n  } catch (e: any) {\n    this.error.set(e.message);\n  }\n}', after: '// New: safeParse never throws — clean success/failure branches\nsubmitHandler() {\n  const result = schema.safeParse(this.form.value);\n  if (result.success) {\n    this.result.set(result.data);\n  } else {\n    this.errors.set(result.error.issues.map(i => i.message));\n  }\n}',
      note: 'safeParse is always preferred for user-facing validation — no try/catch clutter.' },
    { title: 'Manual Angular Validators vs. Zod validator factory', before: '// Old: write each validator manually\nthis.form = this.fb.group({\n  email: [\'\', [Validators.required, Validators.email]],\n  age:   [null, [Validators.required, Validators.min(18)]],\n});', after: '// New: derive validators directly from Zod schemas\nfunction zodValidator(schema: z.ZodSchema) {\n  return (c: AbstractControl): ValidationErrors | null => {\n    const r = schema.safeParse(c.value);\n    return r.success ? null : { zod: r.error.issues[0].message };\n  };\n}\nthis.form = this.fb.group({\n  email: [\'\', zodValidator(z.string().email())],\n  age:   [null, zodValidator(z.coerce.number().min(18))],\n});',
      note: 'One factory function adapts any Zod schema into a reusable Angular validator.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using z.parse() instead of z.safeParse() for form submission', wrong: 'submitHandler() {\n  // Throws on invalid input — unhandled exception crashes the app\n  const data = schema.parse(this.form.value);\n  this.result.set(data);\n}', right: 'submitHandler() {\n  const result = schema.safeParse(this.form.value);\n  if (result.success) this.result.set(result.data);\n  else this.errors.set(result.error.issues.map(i => i.message));\n}', explanation: 'z.parse() throws a ZodError on failure. For user input always use safeParse() which returns a discriminated union — no try/catch required and all issues are available in the error.issues array.'  },
    { title: 'Forgetting z.coerce for numeric form controls', wrong: '// Form control value is always a string from the DOM\nconst schema = z.object({ age: z.number().min(18) });\n// safeParse({ age: \'25\' }) → fails: expected number, received string', right: '// z.coerce.number() converts \'25\' → 25 before validating\nconst schema = z.object({ age: z.coerce.number().min(18) });\n// safeParse({ age: \'25\' }) → success: { age: 25 }', explanation: 'HTML inputs always yield strings. z.coerce.number() converts the string to a number before applying min/max checks — without coerce, numeric validations will always fail on raw form values.'  },
    { title: 'Cross-field .refine() without specifying path', wrong: '// No path — error lands at root [], not on the confirm field\nz.object({ pass: z.string(), confirm: z.string() })\n  .refine(d => d.pass === d.confirm, { message: \'Must match\' });', right: 'z.object({ pass: z.string(), confirm: z.string() })\n  .refine(d => d.pass === d.confirm, {\n    message: \'Passwords must match\',\n    path: [\'confirm\'],  // assigns error to the confirm field\n  });', explanation: 'Without path, the ZodIssue has path: [] (the root object). Setting path: [\'confirm\'] lets field-level helpers like getZodError(\'confirm\') locate and display the error next to the correct input.'  },
    { title: 'Writing a separate TypeScript interface instead of using z.infer', wrong: '// Duplicated — schema and interface can drift\nconst schema = z.object({ name: z.string(), age: z.number() });\ninterface User { name: string; age: number; }  // duplicate!', right: '// Single source of truth — type is always in sync with schema\nconst schema = z.object({ name: z.string(), age: z.number() });\ntype User = z.infer<typeof schema>;', explanation: 'Maintaining a separate interface alongside a Zod schema means two things to keep in sync. z.infer derives the TypeScript type directly from the schema at compile time, so they can never drift.'  },
    { title: 'Not pre-processing form values that need type conversion before safeParse', wrong: '// productForm.tags control is a comma-separated string\n// productSchema expects tags: z.array(z.string()).min(1)\nconst result = productSchema.safeParse(this.productForm.value);\n// Fails: expected array, received string', right: '// Pre-process before parsing\nconst raw = this.productForm.value;\nconst parsed = {\n  ...raw,\n  tags: (raw.tags as string).split(\',\').map(t => t.trim()).filter(Boolean),\n};\nconst result = productSchema.safeParse(parsed);', explanation: 'Zod validates the exact shape you pass it. Form controls yield strings — arrays, booleans, and numbers must be transformed to their correct JS types before calling safeParse. Use z.coerce for scalars and manual transforms for arrays.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Zod is a TypeScript-first runtime schema validation library — use <code>z.infer</code> to derive types from schemas and <code>safeParse()</code> to validate form values and API responses without throwing.',
    mustKnow: [
      '<code>z.safeParse(data)</code> never throws — returns <code>{ success: true, data }</code> or <code>{ success: false, error: ZodError }</code>',
      '<code>type T = z.infer&lt;typeof schema&gt;</code> — derives TypeScript type from schema; single source of truth',
      '<code>z.coerce.number()</code> converts <code>\'25\'</code> → <code>25</code> before validating — required for HTML number inputs',
      'zodValidator factory: wraps <code>safeParse</code> to return Angular <code>ValidationErrors | null</code>',
      'Cross-field <code>.refine()</code>: always set <code>path: [\'fieldName\']</code> to assign the error to a specific field',
      'API response validation: <code>schema.safeParse(responseData)</code> — catches backend contract drift before it causes downstream errors',
      'Pre-process form values before parsing: split comma-strings to arrays, use <code>z.coerce</code> for type conversion',
    ],
    interviewFocus: [
      'What is the difference between <code>z.parse()</code> and <code>z.safeParse()</code>? When would you use each?',
      'How does <code>z.infer</code> eliminate duplicate type definitions?',
      'Why must you use <code>z.coerce.number()</code> instead of <code>z.number()</code> with Angular form controls?',
      'How do you implement a cross-field password-match rule in Zod, and why does <code>path</code> matter?',
      'Walk through the <code>zodValidator</code> factory function — what does it take in, what does it return, and why?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a Zod-Validated Profile Form',
    description: 'Create an Angular reactive form for a user profile that uses Zod for schema validation on submit. The schema must enforce: `username` (string, min 3 chars, max 20 chars, only alphanumeric and underscores), `bio` (optional string, max 160 chars), and `website` (optional string, must be a valid URL if provided). Use `z.infer` to derive the TypeScript type. On submit, call `safeParse` and either set a `result` signal with the parsed data or collect error messages into an `errors` signal.',
    language: 'typescript',
    hints: [
      'Use `z.string().optional()` for fields that may be absent. For a website that can be an empty string OR a valid URL, combine validators: `z.string().url().optional().or(z.literal(\'\'))`.',
      'After calling `profileSchema.safeParse(this.form.value)`, check `parseResult.success`. The `parseResult.error.issues` array has objects with `path` (field name array) and `message` properties.',
      'Derive the TypeScript type with `type ProfileData = z.infer<typeof profileSchema>`. This keeps your type automatically in sync with the schema — no duplicate interface needed.',
      'To validate only allowed characters in a username, use `.regex(/^[a-zA-Z0-9_]+$/, \'error message\')` chained onto the string schema.',
    ],
    starterCode: `import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { z } from 'zod';

// TODO 1: Define profileSchema with username, bio (optional), and website (optional URL)
const profileSchema = z.object({
  // your schema here
});

// TODO 2: Derive ProfileData type from the schema
type ProfileData = any; // replace with z.infer

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label>Username
          <input formControlName="username" placeholder="john_doe" />
        </label>
      </div>
      <div>
        <label>Bio (optional)
          <textarea formControlName="bio" placeholder="Tell us about yourself..."></textarea>
        </label>
      </div>
      <div>
        <label>Website (optional)
          <input formControlName="website" placeholder="https://example.com" />
        </label>
      </div>
      <button type="submit">Save Profile</button>
    </form>

    @if (errors().length > 0) {
      <ul>
        @for (e of errors(); track e) { <li>{{ e }}</li> }
      </ul>
    }
    @if (result()) {
      <pre>{{ result() | json }}</pre>
    }
  \`,
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    bio:      [''],
    website:  [''],
  });

  result = signal<ProfileData | null>(null);
  errors = signal<string[]>([]);

  onSubmit() {
    // TODO 3: Call profileSchema.safeParse with the form value
    // On success: set result signal, clear errors
    // On failure: map issues to 'fieldName: message' strings, set errors signal
  }
}`,
    solution: `import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { z } from 'zod';

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  bio: z.string().max(160, 'Bio must be 160 characters or fewer').optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileData = z.infer<typeof profileSchema>;

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, JsonPipe],
  template: \`
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label>Username
          <input formControlName="username" placeholder="john_doe" />
        </label>
      </div>
      <div>
        <label>Bio (optional)
          <textarea formControlName="bio" placeholder="Tell us about yourself..."></textarea>
        </label>
      </div>
      <div>
        <label>Website (optional)
          <input formControlName="website" placeholder="https://example.com" />
        </label>
      </div>
      <button type="submit">Save Profile</button>
    </form>

    @if (errors().length > 0) {
      <ul>
        @for (e of errors(); track e) { <li>{{ e }}</li> }
      </ul>
    }
    @if (result()) {
      <pre>{{ result() | json }}</pre>
    }
  \`,
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    bio:      [''],
    website:  [''],
  });

  result = signal<ProfileData | null>(null);
  errors = signal<string[]>([]);

  onSubmit() {
    const parseResult = profileSchema.safeParse(this.form.value);
    if (parseResult.success) {
      this.result.set(parseResult.data);
      this.errors.set([]);
    } else {
      const msgs = parseResult.error.issues.map(
        issue => \`\${issue.path.join('.') || 'form'}: \${issue.message}\`
      );
      this.errors.set(msgs);
      this.result.set(null);
    }
  }
}`,
  };
}
