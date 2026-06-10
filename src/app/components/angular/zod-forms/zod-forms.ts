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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

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
  imports: [ReactiveFormsModule, JsonPipe, TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
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

  theory: TheoryPoint[] = [
  {
    heading: 'What is Zod?',
    points: [
      'Zod is a TypeScript-first schema validation library. You define schemas and it infers the TypeScript type.',
      '<code>z.object({ name: z.string().min(2) })</code> — the schema IS the type definition.',
      '<code>schema.parse(data)</code> throws on invalid input. <code>schema.safeParse(data)</code> returns <code>{ success, data, error }</code>.',
      'Zod schemas validate at runtime — they catch API mismatches, malformed user input, and env config errors.',
    ],
  },
  {
    heading: 'Zod + Reactive Forms integration',
    points: [
      'Define validators that call <code>schema.safeParse()</code> and map Zod errors to Angular\'s <code>ValidationErrors</code>.',
      'Use <code>z.infer&lt;typeof mySchema&gt;</code> to get the TypeScript type — no duplicate type definitions.',
      'Validate individual fields with field-level schemas, or the full form value with a group-level schema.',
      'On submit: call <code>schema.parse(form.value)</code> — if it throws, the data structure is wrong; log and handle.',
    ],
  },
  {
    heading: 'Runtime API response validation',
    points: [
      'Parse HTTP responses with Zod to catch backend contract drift early.',
      '<code>const user = UserSchema.parse(response)</code> — if the API removes a required field, you know immediately.',
      'Use <code>safeParse</code> in production to fail gracefully rather than crashing the app.',
      'Combine with TanStack Query\'s <code>queryFn</code>: parse the response inside the function before returning.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Zod runs in the browser — it is not a server-only library. Bundle size is ~14 kB gzipped.',
      'Use <code>.optional()</code> for optional fields, <code>.nullable()</code> for fields that can be null, <code>.nullish()</code> for both.',
      'Zod supports transforms: <code>z.string().transform(s => s.trim())</code> — useful for sanitising form input.',
      'Alternatives: Yup (older, larger), Valibot (smaller, similar API), class-validator (decorator-based, needs reflect-metadata).',
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
  ];

  tabs: CodeTab[] = [
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
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 14', label: 'Standalone components — Zod integration without NgModule', features: ['Standalone components can import ReactiveFormsModule directly in the @Component imports array', 'No NgModule boilerplate required to use FormBuilder, FormGroup, and custom Zod validators together', 'inject(FormBuilder) works in standalone components, replacing constructor injection'] },
    { version: 'Angular 16', label: 'Signals pair naturally with Zod safeParse results', features: ['signal<T | null>(null) stores the typed parse result from z.infer — fully reactive without RxJS', 'computed() enables live field validation: const emailResult = computed(() => z.string().email().safeParse(liveEmail()))', 'signal-based error stores replace BehaviorSubject for surfacing ZodError.issues in the template'] },
  ];

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
