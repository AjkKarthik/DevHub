import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-hook-form',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './hook-form.html',
  styleUrl: './hook-form.scss',
})
export class ReactHookForm {
  quickRef: QuickRefItem[] = [
    { name: 'useForm()',           type: 'hook',     desc: 'Core hook. Returns register, handleSubmit, formState, watch, setValue, reset, control, setError.' },
    { name: 'register(name, opts)',type: 'function', desc: 'Connects an input to RHF. Returns ref, name, onChange, onBlur. Opt in to validation rules inline.' },
    { name: 'handleSubmit(fn)',    type: 'function', desc: 'Wraps the submit handler. Validates all fields, calls fn(data) only on valid form.' },
    { name: '<Controller>',        type: 'syntax',   desc: 'Adapter for controlled components (MUI, Radix, React-Select). Wraps them in RHF via render prop.' },
    { name: 'zodResolver(schema)', type: 'function', desc: 'Connects a Zod schema to RHF validation. Schema + TS type are the single source of truth.' },
    { name: 'useFieldArray()',     type: 'hook',     desc: 'Manage dynamic arrays of fields. Returns fields, append, prepend, remove, move, swap.' },
    { name: 'useFormContext()',     type: 'hook',     desc: 'Access RHF methods from nested components without prop-drilling. Requires FormProvider wrapper.' },
    { name: 'watch(name)',         type: 'function', desc: 'Subscribe to field value changes. Causes re-render on every change — prefer getValues() for one-shot reads.' },
    { name: 'formState.errors',    type: 'accessor', desc: 'Nested object of field errors. error?.message is the string from Zod or inline rules.' },
    { name: 'reset(defaultValues)',type: 'function', desc: 'Reset form to defaultValues (or custom values). Call after successful submit or when editing a loaded entity.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why React Hook Form — minimal re-renders',
      points: [
        '<strong>Uncontrolled by default</strong>: RHF uses refs to read input values — the form does not store input values in React state. This means zero re-renders while the user types, unlike useState-controlled forms which re-render on every keystroke.',
        '<strong>register()</strong> connects a native input to RHF by spreading ref, name, onChange, and onBlur. The ref is how RHF reads the value on submit. <code>const { register, handleSubmit } = useForm()</code> is all you need for a simple form.',
        '<strong>handleSubmit(onValid, onInvalid)</strong> runs validation, then calls onValid(data) with a clean data object. Error objects are set on formState.errors. The form never submits if validation fails.',
        '<strong>defaultValues</strong> should always be provided (especially for async-loaded data). Provide an object that matches the full form shape — RHF uses it for reset and dirty-state tracking.',
      ],
    },
    {
      heading: 'Validation with Zod (zodResolver)',
      points: [
        '<strong>zodResolver</strong> bridges Zod and RHF. Define your schema once — it provides TypeScript types AND runtime validation. Import: <code>import { zodResolver } from "@hookform/resolvers/zod"</code>.',
        '<strong>Type inference</strong>: <code>type FormData = z.infer&lt;typeof schema&gt;</code> gives you the exact TypeScript type for your form. Pass it as the generic to <code>useForm&lt;FormData&gt;</code>.',
        '<strong>Refinements</strong>: <code>.superRefine()</code> and <code>.refine()</code> add cross-field validation (e.g. password === confirmPassword). Return <code>ctx.addIssue()</code> with a path to assign the error to a specific field.',
        '<strong>Transform</strong>: Zod can transform input values — <code>z.string().transform(Number)</code> converts a string input to a number before the data reaches your submit handler. Useful for number inputs which always return strings.',
      ],
    },
    {
      heading: 'Controller and controlled integrations',
      points: [
        '<strong>Controller</strong> is the bridge between RHF and components that do not use native HTML inputs — UI libraries (MUI, Radix, Ant Design), custom pickers, and React Select. It uses a render prop pattern.',
        '<strong>The render prop</strong> receives <code>{ field, fieldState, formState }</code>. Spread <code>field</code> onto the controlled component: <code>&lt;Select {...field}&gt;</code>. field.value and field.onChange are connected to RHF.',
        '<strong>useController()</strong> is the hook version of Controller — useful when building reusable form field components that need access to the RHF context without writing JSX in the parent.',
        '<strong>FormProvider + useFormContext()</strong>: wrap the form in <code>&lt;FormProvider {...methods}&gt;</code> to share the RHF context down the tree. Nested field components can then call <code>useFormContext()</code> instead of receiving props.',
      ],
    },
    {
      heading: 'Dynamic fields with useFieldArray',
      points: [
        '<strong>useFieldArray</strong> manages arrays of fields (line items, addresses, tag lists). Call it with <code>{ control, name: "items" }</code>. It returns <code>fields</code> (array with stable ids), <code>append</code>, <code>remove</code>, <code>prepend</code>, <code>insert</code>, <code>move</code>, <code>swap</code>.',
        '<strong>fields.id</strong> — always use the <code>id</code> property from fields as the React key, never the array index. RHF provides stable IDs so keys stay correct when items are reordered or removed.',
        '<strong>Nested names</strong>: use dot notation and array indices: <code>register("items.0.name")</code>. In practice, use the <code>index</code> from the fields.map() callback: <code>register(\`items.\${index}.name\`)</code>.',
        '<strong>Watching field arrays</strong>: <code>watch("items")</code> re-renders on every change. Prefer reading the array only in handleSubmit. If you must show a live count, wrap that single computed display in useMemo.',
      ],
    },
    {
      heading: 'Performance and advanced patterns',
      points: [
        '<strong>mode</strong> in useForm options controls when validation triggers: "onSubmit" (default, fewest re-renders), "onChange" (every keystroke), "onBlur" (on focus-out), "all" (both). "onSubmit" is best for most forms; "onBlur" is a good second choice for UX.',
        '<strong>shouldUnregister: false</strong> (default) keeps values when a field unmounts — important for multi-step forms where step 2 fields must not lose their values when you go back to step 1. Set to true to clear values on unmount.',
        '<strong>setValue(name, value, { shouldDirty, shouldValidate, shouldTouch })</strong>: imperatively set a field. Pass <code>{ shouldValidate: true }</code> to trigger validation immediately. Use after loading async data for individual fields.',
        '<strong>setError(name, { type, message })</strong>: set a server-returned error on a specific field after submission. Combine with the async submit handler\'s catch block to display API errors inline in the form.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic form + Zod',
      language: 'typescript',
      code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ──── 1. Define schema and infer type ────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional(),
});
type LoginData = z.infer<typeof loginSchema>;

// ──── 2. Form component ──────────────────────────────────────
function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  async function onSubmit(data: LoginData) {
    await fetch('/api/login', { method: 'POST', body: JSON.stringify(data) });
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      <div>
        <input id="remember" type="checkbox" {...register('remember')} />
        <label htmlFor="remember">Remember me</label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}`,
    },
    {
      label: 'Controller (MUI/Radix)',
      language: 'typescript',
      code: `import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';   // controlled third-party component

const schema = z.object({
  name:     z.string().min(1),
  role:     z.object({ value: z.string(), label: z.string() }),
  rating:   z.number().min(1).max(5),
  accepted: z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
});
type FormData = z.infer<typeof schema>;

const roleOptions = [
  { value: 'admin',  label: 'Admin'  },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

function ProfileForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      {/* native input — use register() */}
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}

      {/* controlled third-party — use Controller */}
      <Controller
        name="role"
        control={control}
        render={({ field, fieldState }) => (
          <>
            <Select
              {...field}
              options={roleOptions}
              placeholder="Select role…"
            />
            {fieldState.error && <span>{fieldState.error.message}</span>}
          </>
        )}
      />

      {/* number input (string → number via Zod transform or valueAsNumber) */}
      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <input
            type="range"
            min={1} max={5}
            value={field.value}
            onChange={e => field.onChange(Number(e.target.value))}
          />
        )}
      />

      <input type="checkbox" {...register('accepted')} />
      {errors.accepted && <span>{errors.accepted.message}</span>}

      <button type="submit">Save</button>
    </form>
  );
}`,
    },
    {
      label: 'useFieldArray (dynamic fields)',
      language: 'typescript',
      code: `import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const invoiceSchema = z.object({
  client: z.string().min(1),
  items: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity:    z.number().min(1, 'Min 1'),
    price:       z.number().min(0, 'Must be non-negative'),
  })).min(1, 'At least one item required'),
});
type InvoiceData = z.infer<typeof invoiceSchema>;

function InvoiceForm() {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { client: '', items: [{ description: '', quantity: 1, price: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items   = watch('items');
  const total   = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input {...register('client')} placeholder="Client name" />

      {fields.map((field, index) => (
        // Use field.id as key — NOT index
        <div key={field.id} style={{ display: 'flex', gap: 8 }}>
          <input
            {...register(\`items.\${index}.description\`)}
            placeholder="Description"
          />
          {errors.items?.[index]?.description && (
            <span>{errors.items[index].description?.message}</span>
          )}

          <input
            type="number"
            {...register(\`items.\${index}.quantity\`, { valueAsNumber: true })}
            placeholder="Qty"
          />

          <input
            type="number"
            step="0.01"
            {...register(\`items.\${index}.price\`, { valueAsNumber: true })}
            placeholder="Price"
          />

          <button type="button" onClick={() => remove(index)} disabled={fields.length === 1}>✕</button>
        </div>
      ))}

      {errors.items?.root && <span>{errors.items.root.message}</span>}

      <button type="button" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
        + Add item
      </button>

      <p>Total: \${total.toFixed(2)}</p>
      <button type="submit">Save Invoice</button>
    </form>
  );
}`,
    },
    {
      label: 'FormProvider + server errors',
      language: 'typescript',
      code: `import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3),
  email:    z.string().email(),
  bio:      z.string().max(200).optional(),
});
type FormData = z.infer<typeof schema>;

// ──── Reusable field using useFormContext ──────────────────────
function TextField({ name, label }: { name: keyof FormData; label: string }) {
  const { register, formState: { errors } } = useFormContext<FormData>();
  return (
    <div>
      <label>{label}</label>
      <input {...register(name)} />
      {errors[name] && <p role="alert" style={{ color: 'red' }}>{errors[name]?.message as string}</p>}
    </div>
  );
}

// ──── Parent form with FormProvider ────────────────────────────
function ProfileForm() {
  const methods = useForm<FormData>({ resolver: zodResolver(schema) });
  const { handleSubmit, setError, reset } = methods;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json();
        // Set server errors inline on the relevant field
        if (err.field === 'username') {
          setError('username', { type: 'server', message: err.message });
        }
        return;
      }
      reset(data);   // reset to new values — marks form as clean
    } catch {
      setError('root', { type: 'server', message: 'Network error — try again.' });
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField name="username" label="Username" />
        <TextField name="email"    label="Email"    />
        <TextField name="bio"      label="Bio"      />
        {methods.formState.errors.root && (
          <p role="alert">{methods.formState.errors.root.message}</p>
        )}
        <button type="submit" disabled={methods.formState.isSubmitting}>Save</button>
      </form>
    </FormProvider>
  );
}`,
    },
    {
      label: 'Multi-step form',
      language: 'typescript',
      code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// Per-step schemas
const step1Schema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1) });
const step2Schema = z.object({ email: z.string().email(), phone: z.string().optional() });
const step3Schema = z.object({ plan: z.enum(['free', 'pro', 'enterprise']) });

// Combined schema (superset)
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FullData = z.infer<typeof fullSchema>;

const stepSchemas = [step1Schema, step2Schema, step3Schema];
const stepFields: (keyof FullData)[][] = [
  ['firstName', 'lastName'],
  ['email', 'phone'],
  ['plan'],
];

function MultiStepForm() {
  const [step, setStep] = useState(0);

  const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = useForm<FullData>({
    resolver: zodResolver(fullSchema),
    mode: 'onTouched',
    shouldUnregister: false,   // keep values when step unmounts
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', plan: 'free' },
  });

  async function nextStep() {
    // Validate only the current step's fields
    const valid = await trigger(stepFields[step]);
    if (valid) setStep(s => s + 1);
  }

  async function onSubmit(data: FullData) {
    await fetch('/api/register', { method: 'POST', body: JSON.stringify(data) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 0 && (
        <>
          <input {...register('firstName')} placeholder="First name" />
          {errors.firstName && <span>{errors.firstName.message}</span>}
          <input {...register('lastName')} placeholder="Last name" />
          {errors.lastName && <span>{errors.lastName.message}</span>}
        </>
      )}
      {step === 1 && (
        <>
          <input type="email" {...register('email')} placeholder="Email" />
          {errors.email && <span>{errors.email.message}</span>}
          <input {...register('phone')} placeholder="Phone (optional)" />
        </>
      )}
      {step === 2 && (
        <select {...register('plan')}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      )}

      <div>
        {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)}>← Back</button>}
        {step < 2  && <button type="button" onClick={nextStep}>Next →</button>}
        {step === 2 && <button type="submit" disabled={isSubmitting}>Submit</button>}
      </div>
    </form>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using watch() for performance-sensitive re-renders',
      wrong: `// watch() subscribes the entire component to ALL field changes
function OrderForm() {
  const { register, watch } = useForm();
  const quantity = watch('quantity');
  const price    = watch('price');
  const total    = quantity * price;   // re-renders on EVERY keystroke
  return <>{/* ... */}</>;
}`,
      right: `// Use getValues() inside handleSubmit for one-shot reads
// Or watch only what you render to the user — not for hidden computations
function OrderForm() {
  const { register, handleSubmit, getValues } = useForm();
  function onSubmit(data) {
    const total = data.quantity * data.price;   // read once, at submit time
  }
  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
}`,
      explanation: 'watch() causes a re-render every time the watched field changes — using it for values that only matter at submit time re-renders the component on every keystroke. Use getValues() inside event handlers for one-shot reads, or watch only fields whose live values need to be displayed to the user.',
    },
    {
      title: 'Using array index as key in useFieldArray',
      wrong: `const { fields, remove } = useFieldArray({ control, name: 'items' });
return fields.map((_, index) => (
  <div key={index}>   {/* ← wrong: index changes when items are removed */}
    <input {...register(\`items.\${index}.name\`)} />
    <button onClick={() => remove(index)}>Remove</button>
  </div>
));`,
      right: `const { fields, remove } = useFieldArray({ control, name: 'items' });
return fields.map((field, index) => (
  <div key={field.id}>   {/* ← correct: RHF provides stable unique IDs */}
    <input {...register(\`items.\${index}.name\`)} />
    <button onClick={() => remove(index)}>Remove</button>
  </div>
));`,
      explanation: 'RHF provides a stable id on each field object specifically for use as React keys. Using array index as key causes inputs to receive wrong values and animations to glitch when items are reordered or removed from the middle of the array.',
    },
    {
      title: 'Missing defaultValues (causes "uncontrolled to controlled" warning)',
      wrong: `const { register } = useForm<{ name: string; age: number }>();
// name and age are undefined initially — async load sets them later via reset()
// React warns: component changing uncontrolled input to controlled`,
      right: `const { register, reset } = useForm<{ name: string; age: number }>({
  defaultValues: { name: '', age: 0 },   // always provide defaults matching the shape
});
// Load async data, then:
useEffect(() => {
  fetchUser().then(user => reset(user));
}, []);`,
      explanation: 'Without defaultValues, RHF initializes fields as undefined. When async data loads and values become strings/numbers, React sees it as switching from uncontrolled to controlled. Always provide defaultValues matching the full form shape — use empty strings and 0 for string/number fields.',
    },
    {
      title: 'Putting validation logic in both Zod AND inline rules',
      wrong: `const schema = z.object({ email: z.string().email() });
// Duplicate validation — Zod says one thing, inline rule says another
<input {...register('email', { pattern: { value: /^\\S+@\\S+\\.\\S+$/, message: 'Bad email' } })} />`,
      right: `const schema = z.object({ email: z.string().email('Invalid email') });
// zodResolver IS the validation — never duplicate with inline rules
<input {...register('email')} />
{errors.email && <span>{errors.email.message}</span>}`,
      explanation: 'When using zodResolver, it is the single source of validation truth. Adding inline validation rules (required, pattern, min, max) to register() runs a separate validation pass that can conflict with Zod. Pick one — zodResolver for schemas, inline rules for simple forms without a resolver.',
    },
    {
      title: 'Not using noValidate on the form element',
      wrong: `<form onSubmit={handleSubmit(onSubmit)}>
  {/* HTML5 browser validation fires BEFORE RHF validation — shows native popups */}
  <input type="email" {...register('email')} required />
</form>`,
      right: `<form onSubmit={handleSubmit(onSubmit)} noValidate>
  {/* noValidate disables browser native validation popups — RHF handles everything */}
  <input type="email" {...register('email')} />
</form>`,
      explanation: 'Without noValidate, the browser\'s built-in validation (required, type="email", pattern) fires before RHF and shows native browser error popups that are not styled and cannot be controlled. noValidate disables browser validation so RHF is the sole validation layer.',
    },
    {
      title: 'Forgetting valueAsNumber for number inputs',
      wrong: `// HTML inputs always return strings — type="number" still gives "42" as a string
<input type="number" {...register('age')} />
// data.age === "42" (string!) — breaks arithmetic and Zod z.number() validation`,
      right: `// Option 1: valueAsNumber in register options
<input type="number" {...register('age', { valueAsNumber: true })} />

// Option 2: z.coerce.number() in Zod schema — coerces string → number
const schema = z.object({ age: z.coerce.number().min(0).max(120) });`,
      explanation: 'HTML input elements always return strings — even type="number". RHF\'s register() will give you "42" as a string without valueAsNumber. This breaks z.number() validators and arithmetic. Either add { valueAsNumber: true } to register, or use z.coerce.number() in your Zod schema to coerce automatically.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a User Registration Form',
    language: 'typescript',
    description: `Build a multi-field user registration form using React Hook Form + Zod:

1. Fields: username (min 3 chars), email, password (min 8 chars), confirmPassword, role (select: "user" | "admin")
2. Cross-field validation: confirmPassword must equal password (use z.superRefine or .refine)
3. Show inline error messages below each field
4. Disable the submit button while submitting (isSubmitting)
5. On successful submit, reset the form and show a success message
6. Use noValidate on the form to prevent browser native validation popups`,
    hints: [
      'const schema = z.object({ ... }).refine(data => data.password === data.confirmPassword, { message: "...", path: ["confirmPassword"] })',
      'type FormData = z.infer<typeof schema>  — use this as the generic for useForm<FormData>()',
      'const { formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm(...)',
      'reset() after submit, then show a success message based on isSubmitSuccessful',
    ],
    starterCode: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// TODO: Define the Zod schema with cross-field password confirmation
const schema = z.object({
  username:        z.string(),
  email:           z.string(),
  password:        z.string(),
  confirmPassword: z.string(),
  role:            z.enum(['user', 'admin']),
  // TODO: add .refine() for password confirmation
});

type FormData = z.infer<typeof schema>;

export default function RegistrationForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({
    // TODO: wire up zodResolver and defaultValues
  });

  async function onSubmit(data: FormData) {
    await new Promise(r => setTimeout(r, 1000));  // simulate API call
    console.log('Registered:', data);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* TODO: add all fields with error messages */}
      {isSubmitSuccessful && <p>Registration successful!</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}`,
    solution: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username:        z.string().min(3, 'Username must be at least 3 characters'),
  email:           z.string().email('Invalid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role:            z.enum(['user', 'admin']),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegistrationForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', role: 'user' },
  });

  async function onSubmit(data: FormData) {
    await new Promise(r => setTimeout(r, 1000));
    console.log('Registered:', data);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <div>
        <label>Username</label>
        <input {...register('username')} placeholder="username" />
        {errors.username && <p role="alert" style={{ color: 'red', margin: '4px 0 0' }}>{errors.username.message}</p>}
      </div>
      <div>
        <label>Email</label>
        <input type="email" {...register('email')} placeholder="you@example.com" />
        {errors.email && <p role="alert" style={{ color: 'red', margin: '4px 0 0' }}>{errors.email.message}</p>}
      </div>
      <div>
        <label>Password</label>
        <input type="password" {...register('password')} />
        {errors.password && <p role="alert" style={{ color: 'red', margin: '4px 0 0' }}>{errors.password.message}</p>}
      </div>
      <div>
        <label>Confirm password</label>
        <input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p role="alert" style={{ color: 'red', margin: '4px 0 0' }}>{errors.confirmPassword.message}</p>}
      </div>
      <div>
        <label>Role</label>
        <select {...register('role')}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p role="alert" style={{ color: 'red', margin: '4px 0 0' }}>{errors.role.message}</p>}
      </div>
      {isSubmitSuccessful && <p style={{ color: 'green' }}>Registration successful!</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why does React Hook Form cause fewer re-renders than controlled forms (useState)?',
      options: ['It uses a Web Worker to process validation off the main thread', 'It uses refs to read input values — inputs are uncontrolled by default, so React does not re-render on every keystroke', 'It batches all validation into a single setState call', 'It uses useMemo to cache field values'],
      answer: 1,
      explanation: 'RHF registers inputs via refs. The DOM holds the value, not React state. React only re-renders when formState properties (errors, isSubmitting, etc.) change — not on every keystroke. This is the core performance benefit over useState-controlled forms.',
    },
    {
      q: 'What does zodResolver() do in the useForm options?',
      options: ['It imports the Zod library into the component', 'It bridges a Zod schema to RHF — Zod validates data on submit and maps errors to RHF\'s formState.errors', 'It replaces handleSubmit with a Zod-specific version', 'It enables real-time validation on every keystroke'],
      answer: 1,
      explanation: 'zodResolver() is an adapter from @hookform/resolvers that connects RHF\'s validation step to a Zod schema. When handleSubmit runs, it passes form data to the Zod schema — if validation fails, errors are set on formState.errors keyed by field name.',
    },
    {
      q: 'When should you use <Controller> instead of register()?',
      options: ['When you have more than 3 fields in a form', 'When working with controlled third-party components (MUI, Radix, React-Select) that do not expose a ref', 'When you need async validation', 'When the field array has more than 10 items'],
      answer: 1,
      explanation: 'register() works with native HTML inputs via refs. Controlled UI library components (MUI TextField, Radix Select, React-Select) manage their own state and do not expose a ref that RHF can attach to. Controller wraps them via value/onChange props instead.',
    },
    {
      q: 'Why must you use field.id (not index) as the key in useFieldArray?',
      options: ['field.id is required by React 18\'s concurrent renderer', 'RHF assigns stable unique IDs — using index as key causes wrong values and broken animations when items are removed or reordered', 'field.id is needed for accessibility labelling', 'Using index as key causes an infinite loop in validation'],
      answer: 1,
      explanation: 'Array index keys break React reconciliation when items are added, removed, or reordered — the same input can receive a different item\'s previous value. RHF provides a stable id on each field object that uniquely identifies it across re-renders, so always use field.id as the React key.',
    },
    {
      q: 'What does shouldUnregister: false (the default) do in a multi-step form?',
      options: ['Prevents the form from re-rendering when a step unmounts', 'Keeps field values in RHF state when a field unmounts — values are preserved when the user navigates between steps', 'Disables validation for hidden steps', 'Prevents the browser from clearing autofill values'],
      answer: 1,
      explanation: 'By default, RHF keeps field values in its internal store even when the field\'s input element is removed from the DOM (unmounted). This is essential for multi-step forms — if you set shouldUnregister: true, navigating back from step 2 to step 1 would clear step 2\'s values.',
    },
    {
      q: 'Why should you add noValidate to the <form> element?',
      options: ['It disables RHF validation and uses only Zod', 'It prevents the browser\'s native HTML5 validation UI (required popups, type="email" warning tooltips) from firing before RHF handles validation', 'It is required for React 18\'s form transitions', 'It disables autocomplete on all inputs'],
      answer: 1,
      explanation: 'Without noValidate, the browser runs its own validation (required, minlength, type="email") and shows native browser popup messages BEFORE your handleSubmit runs. These popups are not styled and cannot be customised. noValidate turns off browser validation so RHF is the sole validation layer.',
    },
    {
      q: 'How do you handle a number input that keeps returning a string value?',
      options: ['Change input type to "text" and parse in the submit handler', 'Add { valueAsNumber: true } to register() options, or use z.coerce.number() in the Zod schema', 'Wrap the input in a Controller and manually parse', 'Use a hidden input that stores the parsed number'],
      answer: 1,
      explanation: 'HTML inputs always return strings from event.target.value — even type="number". Register\'s { valueAsNumber: true } option converts the string to a number automatically. Alternatively, z.coerce.number() in Zod coerces the string-as-number during schema validation. Either approach works; the Zod option also handles NaN → validation error.',
    },
    {
      q: 'What is the purpose of setError("root", { message }) after a failed API call?',
      options: ['It stops all further form submissions', 'It attaches a form-level error (not tied to a specific field) to formState.errors.root — useful for network errors or server rejections', 'It logs the error to the console', 'It resets the form and shows the error in a toast'],
      answer: 1,
      explanation: 'setError("root", {...}) sets a form-level error in formState.errors.root. Unlike field-level errors, it is not tied to any input. Render it as a general error banner: {errors.root && <p>{errors.root.message}</p>}. Clear it on retry with clearErrors("root").',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use React Hook Form vs the native React Forms page approach?',
      a: 'Use React Hook Form any time a form has more than 2-3 fields, needs validation, or submits to an API. The native useState approach is fine for tiny one-off forms (a single search input) but quickly becomes verbose with validation logic scattered across components. RHF gives you validation, error objects, loading state, dirty tracking, and reset for free.',
    },
    {
      q: 'Can I use React Hook Form without Zod?',
      a: 'Yes — RHF has built-in inline validation rules (required, minLength, pattern, validate) you pass to register(). Zod is recommended when forms are complex (cross-field validation, transformations, reuse between form and API), but simple forms work fine with inline rules alone. Yup and Joi also have resolvers in @hookform/resolvers.',
    },
    {
      q: 'How do I populate a form with data loaded from an API?',
      a: 'Use reset(serverData) inside a useEffect that fires once data loads. Provide defaultValues matching the form shape (even if empty) so there are no uncontrolled-to-controlled warnings initially. reset() also resets the dirty/touched state so the form correctly shows as "unchanged" after loading. Never try to set individual fields via setValue in a loop — one reset() call is cleaner.',
    },
    {
      q: 'How do I share RHF state between deeply nested components?',
      a: 'Wrap the form in <FormProvider {...methods}> where methods comes from useForm(). Any descendant can then call useFormContext<FormData>() to access register, formState, control, and all other methods without prop drilling. This is the idiomatic pattern for building reusable field components in a design system.',
    },
    {
      q: 'What is the difference between mode: "onChange" and mode: "onBlur"?',
      a: '"onChange" validates after every keystroke — highest re-render count, best for real-time feedback (password strength, format checks). "onBlur" validates when the user leaves a field — fewer re-renders, lower anxiety UX since errors only appear after you try to leave. "onSubmit" (default) validates only when the form is submitted — zero re-renders during typing, errors appear all at once. Most forms use "onBlur" or "onSubmit".',
    },
    {
      q: 'How do I conditionally show or hide fields and preserve their values in RHF?',
      a: 'By default, unregistered (hidden) fields retain their values in the RHF store. If you want to clear the value when the field is hidden, pass shouldUnregister: true to useForm(). With shouldUnregister: true, RHF automatically removes the value when the component unmounts. Pair this with Zod .optional() so the schema does not require the hidden field.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Uncontrolled refs = zero re-renders while typing. register() for native inputs, Controller for UI libs, zodResolver for type-safe validation.',
    mustKnow: [
      'register() connects native inputs via ref — no state, no re-renders on keystrokes',
      'handleSubmit(fn) validates, then calls fn(data) — only fires on valid form',
      'zodResolver(schema): Zod schema is the single source of validation AND TypeScript types',
      'Controller: adapter for controlled third-party components (MUI, Radix, React-Select)',
      'useFieldArray: fields.id as React key (NOT index), append/remove/move for dynamic rows',
      'FormProvider + useFormContext: share RHF context without prop drilling to deep field components',
      'noValidate on <form>: disables browser native popup validation so RHF is sole validator',
    ],
    interviewFocus: [
      'Why does RHF cause fewer re-renders than controlled forms — explain uncontrolled vs controlled',
      'When would you use Controller instead of register()?',
      'How do you handle cross-field validation with Zod (e.g. password === confirmPassword)?',
      'How do you handle server-returned field errors in RHF?',
    ],
  };
}
