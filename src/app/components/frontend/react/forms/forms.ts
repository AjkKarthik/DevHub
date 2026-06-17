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
  selector: 'app-react-forms',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './forms.html',
  styleUrl: './forms.scss',
})
export class ReactForms {
  quickRef: QuickRefItem[] = [
    { name: 'controlled input',            type: 'syntax',   desc: 'value={state} + onChange — React owns the value. Enables real-time validation.' },
    { name: 'uncontrolled input',          type: 'syntax',   desc: 'ref={inputRef} — DOM owns the value. Use for file inputs or integrating with third-party libs.' },
    { name: 'e.preventDefault()',          type: 'method',   desc: 'Prevents default form submission/page reload. Call inside onSubmit handler.' },
    { name: 'e.target.elements',           type: 'accessor', desc: 'Access uncontrolled form fields by name via FormData or named element lookup.' },
    { name: 'new FormData(e.currentTarget)',type: 'syntax',   desc: 'Read all named inputs at once from the native form element.' },
    { name: 'register(name)',              type: 'function', desc: 'React Hook Form: bind input with ref-based registration — minimal re-renders.' },
    { name: 'handleSubmit(onValid)',       type: 'function', desc: 'RHF: validates on submit, calls onValid only if all fields pass.' },
    { name: 'formState.errors',            type: 'accessor', desc: 'RHF: per-field error objects; display with {errors.email?.message}.' },
    { name: 'zodResolver(schema)',         type: 'function', desc: 'RHF resolver: runs Zod schema validation, maps errors to RHF error objects.' },
    { name: 'Controller',                  type: 'class',    desc: 'RHF: wraps controlled components (MUI, Radix) into RHF without register().' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Controlled vs uncontrolled inputs',
      points: [
        '<strong>Controlled inputs</strong> keep value in React state — <code>value={state}</code> + <code>onChange={e =&gt; setState(e.target.value)}</code>. React owns the source of truth, enabling real-time validation, conditional UI, and formatted input.',
        '<strong>Uncontrolled inputs</strong> let the DOM own the value. Access it via a ref (<code>inputRef.current.value</code>) or <code>new FormData(form)</code> on submit. Simpler for one-off forms; can\'t do real-time validation.',
        '<strong>File inputs are always uncontrolled</strong> — you cannot set their value programmatically. Use a ref to read <code>inputRef.current.files</code>.',
        '<strong>Rule of thumb:</strong> start with controlled inputs. Switch to uncontrolled only when you\'re integrating with a non-React library, need raw file access, or the form is large and performance is measurably impacted.',
      ],
    },
    {
      heading: 'HTML5 native validation',
      points: [
        '<strong>Native validation attributes</strong> — <code>required</code>, <code>minLength</code>, <code>maxLength</code>, <code>pattern</code>, <code>min</code>, <code>max</code>, <code>type="email"</code> — provide zero-JS validation that browsers enforce before submit.',
        '<strong>Limitations:</strong> styling is browser-specific and hard to customise; validation triggers only on submit by default; error messages are not translatable without JS; cross-field validation (confirm password) is not possible without JS.',
        '<strong>setCustomValidity</strong> lets you attach a custom error message to a native input. Call it in an event handler and the browser\'s constraint validation API will show your message.',
        'For production apps, native validation is a useful accessibility baseline but almost always supplemented with JS validation for richer UX and server-mirrored schemas.',
      ],
    },
    {
      heading: 'React Hook Form — minimal re-renders',
      points: [
        '<strong>React Hook Form (RHF)</strong> uses uncontrolled inputs internally via refs — <code>register()</code> attaches <code>ref</code>, <code>onChange</code>, <code>onBlur</code>, and <code>name</code>. This means the component does not re-render on every keystroke.',
        '<strong>handleSubmit(onValid, onInvalid)</strong> validates the form on submit and only calls <code>onValid</code> when all fields pass. No manual preventDefault needed — RHF handles it.',
        '<strong>formState.errors</strong> is the per-field error map. Access individual errors with <code>errors.fieldName?.message</code>. The component re-renders only when errors change, not on every keystroke.',
        '<strong>watch()</strong> subscribes a component to field value changes — only use it when you genuinely need real-time derived state (e.g. password strength meter). Excessive watch() calls defeat RHF\'s performance advantage.',
        '<strong>Controller</strong> wraps a controlled component (Material UI, Radix, react-select) inside RHF\'s field management without using register() + ref.',
      ],
    },
    {
      heading: 'Zod schema validation',
      points: [
        '<strong>Zod</strong> is a TypeScript-first schema library. Define a schema once — Zod infers the TypeScript type and validates at runtime. <code>z.infer&lt;typeof schema&gt;</code> gives the typed form values.',
        '<strong>zodResolver</strong> from <code>@hookform/resolvers/zod</code> bridges Zod and RHF. Pass it to <code>useForm({ resolver: zodResolver(schema) })</code> and all validation logic lives in the schema.',
        '<strong>Cross-field validation</strong> uses <code>.refine()</code> or <code>.superRefine()</code> on the root schema object — e.g. confirm password matching.',
        '<strong>Transform and coerce:</strong> <code>z.coerce.number()</code> converts string input values to numbers automatically. <code>z.string().transform(s =&gt; s.trim())</code> strips whitespace before validation.',
      ],
    },
    {
      heading: 'Form UX best practices',
      points: [
        '<strong>Validate on blur, show errors on submit.</strong> Showing errors before the user leaves a field is annoying — wait until blur or first submit attempt, then switch to on-change validation.',
        '<strong>Accessible forms:</strong> every input needs a <code>&lt;label&gt;</code> linked via <code>htmlFor</code>/<code>id</code>; error messages need <code>aria-describedby</code> or <code>role="alert"</code>; required fields need both <code>required</code> attr and visible indicator.',
        '<strong>Optimistic submit:</strong> disable the submit button only while submitting (not while invalid). Letting users attempt submit with invalid data and showing all errors at once is better UX than blocking the button.',
        '<strong>Reset after submit:</strong> call RHF\'s <code>reset()</code> after successful submission to clear all fields and errors, returning the form to its default values.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Controlled form',
      language: 'typescript',
      code: `import { useState } from 'react';

interface FormValues { email: string; password: string; }
interface Errors { email?: string; password?: string; }

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  if (!values.email.includes('@')) errors.email = 'Enter a valid email';
  if (values.password.length < 8)  errors.password = 'Min 8 characters';
  return errors;
}

function LoginForm() {
  const [values,   setValues]   = useState<FormValues>({ email: '', password: '' });
  const [errors,   setErrors]   = useState<Errors>({});
  const [touched,  setTouched]  = useState<Set<string>>(new Set());
  const [submitting, setSubmit] = useState(false);

  const change = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (touched.has(field)) setErrors(validate(next));  // live validation after first blur
  };

  const blur = (field: keyof FormValues) => () => {
    setTouched(prev => new Set(prev).add(field));
    setErrors(validate(values));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmit(true);
    try {
      await fakeLogin(values);
    } finally {
      setSubmit(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={values.email} onChange={change('email')} onBlur={blur('email')} aria-describedby="email-error" />
        {errors.email && <span id="email-error" role="alert">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={values.password} onChange={change('password')} onBlur={blur('password')} aria-describedby="pw-error" />
        {errors.password && <span id="pw-error" role="alert">{errors.password}</span>}
      </div>
      <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}`,
    },
    {
      label: 'React Hook Form + Zod',
      language: 'typescript',
      code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(20),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    await createUser(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" {...register('username')} aria-describedby="username-err" />
        {errors.username && <span id="username-err" role="alert">{errors.username.message}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} aria-describedby="email-err" />
        {errors.email && <span id="email-err" role="alert">{errors.email.message}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <span role="alert">{errors.password.message}</span>}
      </div>
      <div>
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" type="password" {...register('confirm')} />
        {errors.confirm && <span role="alert">{errors.confirm.message}</span>}
      </div>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Register'}</button>
    </form>
  );
}`,
    },
    {
      label: 'RHF Controller (custom input)',
      language: 'typescript',
      code: `import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  country: z.string().min(1, 'Select a country'),
  agreed:  z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});
type FormValues = z.infer<typeof schema>;

// Imagine this is a custom/third-party select component that uses value/onChange
function CustomSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ShippingForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <CustomSelect
            value={field.value ?? ''}
            onChange={field.onChange}
            options={['Canada', 'UK', 'Australia', 'Germany']}
          />
        )}
      />
      {errors.country && <span role="alert">{errors.country.message}</span>}

      <Controller
        name="agreed"
        control={control}
        render={({ field }) => (
          <label>
            <input type="checkbox" checked={!!field.value} onChange={e => field.onChange(e.target.checked || undefined)} />
            I agree to the terms
          </label>
        )}
      />
      {errors.agreed && <span role="alert">{errors.agreed.message}</span>}

      <button type="submit">Continue</button>
    </form>
  );
}`,
    },
    {
      label: 'Dynamic field array',
      language: 'typescript',
      code: `import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  links: z.array(z.object({
    label: z.string().min(1, 'Required'),
    url:   z.string().url('Must be a valid URL'),
  })).min(1, 'Add at least one link'),
});
type FormValues = z.infer<typeof schema>;

function LinkListForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', links: [{ label: '', url: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'links' });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input {...register('title')} placeholder="Collection title" />
      {errors.title && <span>{errors.title.message}</span>}

      {fields.map((field, i) => (
        <div key={field.id}>
          <input {...register(\`links.\${i}.label\`)} placeholder="Label" />
          {errors.links?.[i]?.label && <span>{errors.links[i]?.label?.message}</span>}
          <input {...register(\`links.\${i}.url\`)} placeholder="https://…" />
          {errors.links?.[i]?.url && <span>{errors.links[i]?.url?.message}</span>}
          <button type="button" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ label: '', url: '' })}>+ Add link</button>
      {errors.links?.root && <span>{errors.links.root.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
}`,
    },
    {
      label: 'Uncontrolled + FormData',
      language: 'typescript',
      code: `import { useRef } from 'react';

function SimpleForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = Object.fromEntries(data.entries());
    console.log(values); // { name: '...', email: '...' }
  };

  const handleReset = () => formRef.current?.reset();

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input name="name"  placeholder="Name"  required minLength={2} />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Send</button>
      <button type="button" onClick={handleReset}>Clear</button>
    </form>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting state on every keystroke without debounce',
      wrong: `const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

const handleChange = (e) => {
  setQuery(e.target.value);
  setResults(expensiveFilter(e.target.value));  // runs on every keystroke
};`,
      right: `const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const handleChange = (e) => setQuery(e.target.value);

// Derive results with useMemo — only when query changes
const results = useMemo(() => expensiveFilter(query), [query]);`,
      explanation: 'Running expensive operations synchronously on every keystroke blocks the input and causes jank. Use useMemo for derived computed state; use useTransition or useDeferredValue for heavy renders.',
    },
    {
      title: 'Not calling e.preventDefault()',
      wrong: `function Form() {
  const handleSubmit = (data) => {
    // browser submits form to current URL, page reloads
    saveData(data);
  };
  return <form onSubmit={handleSubmit}>...</form>;
}`,
      right: `function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();   // stop native form submission
    saveData(formValues);
  };
  return <form onSubmit={handleSubmit}>...</form>;
}`,
      explanation: 'Without preventDefault, the browser performs a native form submission (GET/POST to the current URL), causing a page reload and losing all React state. React Hook Form calls preventDefault internally; raw onSubmit handlers must call it explicitly.',
    },
    {
      title: 'Using watch() on every field',
      wrong: `const { register, watch } = useForm();
const all = watch();   // subscribes to all fields — re-renders on every keystroke
return (
  <div>
    <input {...register('name')} />
    <p>Preview: {all.name}</p>
  </div>
);`,
      right: `const { register, watch } = useForm();
const name = watch('name');   // subscribe to only the fields you need
return (
  <div>
    <input {...register('name')} />
    <p>Preview: {name}</p>
  </div>
);`,
      explanation: 'watch() with no arguments subscribes to every field and re-renders on every change — defeating RHF\'s uncontrolled-input performance advantage. Only watch specific fields you need to react to.',
    },
    {
      title: 'Forgetting htmlFor / id linkage',
      wrong: `<label>Email</label>
<input type="email" onChange={...} />
{/* label and input are not linked — screen readers cannot associate them */}`,
      right: `<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-err" onChange={...} />
{error && <span id="email-err" role="alert">{error}</span>}`,
      explanation: 'Unlabeled inputs are inaccessible. Clicking the label should focus the input (htmlFor=id). Error messages need aria-describedby so screen readers announce them when the field is focused.',
    },
    {
      title: 'Validating inside onChange instead of onBlur',
      wrong: `<input
  onChange={e => {
    setValue(e.target.value);
    if (!e.target.value) setError('Required');  // shows error immediately on first character
  }}
/>`,
      right: `<input
  onChange={e => {
    setValue(e.target.value);
    if (touched) validate(e.target.value);  // only after the field was blurred once
  }}
  onBlur={() => { setTouched(true); validate(value); }}
/>`,
      explanation: 'Showing errors while the user is still typing is frustrating. The standard UX pattern is validate on blur (first time), then switch to real-time validation after the user has left the field once.',
    },
    {
      title: 'Missing Zod coerce for number inputs',
      wrong: `const schema = z.object({ age: z.number().min(1) });
// HTML inputs always return strings — z.number() fails with "Expected number, received string"`,
      right: `const schema = z.object({ age: z.coerce.number().min(1, 'Must be at least 1') });
// z.coerce.number() converts "25" → 25 before validation`,
      explanation: 'HTML input values are always strings, even type="number". Use z.coerce.number() (or z.coerce.date()) to convert string inputs to the target type before Zod validates them.',
    },
  ];

  challenge: Challenge = {
    title: 'Multi-Step Registration Form',
    language: 'typescript',
    description: `Build a 3-step registration form using React Hook Form + Zod:

Step 1 — Account: email (valid email), password (min 8), confirmPassword (must match password)
Step 2 — Profile: firstName (min 2), lastName (min 2), birthYear (number, 1900–2010)
Step 3 — Review: show all entered data, a "Submit" button, and a "Back" button

Requirements:
- Use a single useForm instance with a combined Zod schema
- Each step validates only its own fields before advancing (trigger(['field1', 'field2']))
- Show a step progress indicator (Step 1 of 3)
- On final submit, log the data and show a success message`,
    hints: [
      'Use trigger(["email", "password", "confirmPassword"]) to validate only step-1 fields before advancing',
      'Cross-field validation (confirm password) uses .refine() on the schema object',
      'z.coerce.number() converts birthYear string input to a number for min/max validation',
      'Keep step index in useState — the form state persists across steps because it\'s a single useForm instance',
    ],
    starterCode: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  // TODO: define all fields
}).refine(/* TODO: confirm password */);

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { title: 'Account',  fields: ['email', 'password', 'confirmPassword'] as const },
  { title: 'Profile',  fields: ['firstName', 'lastName', 'birthYear']   as const },
  { title: 'Review',   fields: [] as const },
];

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const next = async () => {
    const valid = await trigger(STEPS[step].fields as any);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = (data: FormValues) => console.log('Submitted:', data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>Step {step + 1} of {STEPS.length}: {STEPS[step].title}</p>
      {/* TODO: render fields per step */}
      {/* TODO: navigation buttons */}
    </form>
  );
}

export default MultiStepForm;`,
    solution: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
  firstName:       z.string().min(2, 'Min 2 characters'),
  lastName:        z.string().min(2, 'Min 2 characters'),
  birthYear:       z.coerce.number().min(1900).max(2010, 'Must be 1900–2010'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormValues = z.infer<typeof schema>;

const STEPS: { title: string; fields: (keyof FormValues)[] }[] = [
  { title: 'Account', fields: ['email', 'password', 'confirmPassword'] },
  { title: 'Profile', fields: ['firstName', 'lastName', 'birthYear'] },
  { title: 'Review',  fields: [] },
];

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const next = async () => { if (await trigger(STEPS[step].fields)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);
  const onSubmit = (data: FormValues) => { console.log(data); setDone(true); };

  if (done) return <p>Registration complete!</p>;

  const vals = getValues();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>Step {step + 1} of {STEPS.length}: {STEPS[step].title}</p>

      {step === 0 && <>
        <div><label>Email<input type="email" {...register('email')} /></label>{errors.email && <span>{errors.email.message}</span>}</div>
        <div><label>Password<input type="password" {...register('password')} /></label>{errors.password && <span>{errors.password.message}</span>}</div>
        <div><label>Confirm<input type="password" {...register('confirmPassword')} /></label>{errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}</div>
      </>}

      {step === 1 && <>
        <div><label>First name<input {...register('firstName')} /></label>{errors.firstName && <span>{errors.firstName.message}</span>}</div>
        <div><label>Last name<input {...register('lastName')} /></label>{errors.lastName && <span>{errors.lastName.message}</span>}</div>
        <div><label>Birth year<input type="number" {...register('birthYear')} /></label>{errors.birthYear && <span>{errors.birthYear.message}</span>}</div>
      </>}

      {step === 2 && (
        <dl>
          <dt>Email</dt><dd>{vals.email}</dd>
          <dt>Name</dt><dd>{vals.firstName} {vals.lastName}</dd>
          <dt>Birth year</dt><dd>{vals.birthYear}</dd>
        </dl>
      )}

      <div>
        {step > 0 && <button type="button" onClick={back}>← Back</button>}
        {step < STEPS.length - 1 && <button type="button" onClick={next}>Next →</button>}
        {step === STEPS.length - 1 && <button type="submit" disabled={isSubmitting}>Submit</button>}
      </div>
    </form>
  );
}

export default MultiStepForm;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main performance advantage of React Hook Form over controlled inputs?',
      options: ['It uses Web Workers', 'It avoids re-rendering the component on every keystroke by using uncontrolled inputs with refs', 'It batches all updates with useTransition', 'It does not use state at all'],
      answer: 1,
      explanation: 'RHF registers inputs via refs and only re-renders when validation errors change or on submit. Controlled inputs re-render the component on every keystroke.',
    },
    {
      q: 'Why should you use z.coerce.number() for a number input field?',
      options: ['HTML inputs always return values as strings; coerce converts "25" → 25 before Zod validates', 'Zod does not support the number type', 'It prevents negative numbers automatically', 'It is required for type="number" inputs to work with RHF'],
      answer: 0,
      explanation: 'HTML input elements always return string values. z.coerce.number() converts the string to a number before running min/max validations. Without coerce, Zod throws "Expected number, received string".',
    },
    {
      q: 'What does zodResolver do in useForm({ resolver: zodResolver(schema) })?',
      options: ['Converts Zod errors to React state', 'Runs the Zod schema on form submit and maps validation errors to RHF\'s error format', 'Generates the form UI automatically from the schema', 'Replaces handleSubmit'],
      answer: 1,
      explanation: 'zodResolver is an adapter from @hookform/resolvers/zod. It calls schema.safeParse() on submit and maps Zod errors to RHF\'s per-field errors object so you can display them via formState.errors.',
    },
    {
      q: 'When should you use Controller instead of register()?',
      options: ['Always — Controller is the recommended API', 'For native HTML inputs', 'When wrapping a controlled third-party component (Material UI, Radix) that uses value/onChange props', 'When you need real-time validation'],
      answer: 2,
      explanation: 'register() attaches a ref to native HTML inputs. Controller wraps components that are already controlled (accept value and onChange) so RHF can manage them without a ref — necessary for UI library components.',
    },
    {
      q: 'Which HTML attribute should you add to a <form> element when using custom JS validation?',
      options: ['validate="false"', 'noValidate', 'type="custom"', 'skipValidation'],
      answer: 1,
      explanation: 'noValidate disables native browser validation (tooltip pop-ups and preventing submit). Without it, both browser validation and your JS validation run, potentially showing duplicate or conflicting error messages.',
    },
    {
      q: 'What is the standard UX pattern for showing validation errors?',
      options: ['Show errors as soon as the user starts typing', 'Show errors after the field is blurred; switch to real-time validation once the field has been touched', 'Disable the submit button until all fields are valid', 'Show errors only after the form is submitted'],
      answer: 1,
      explanation: 'Showing errors while typing is annoying. The standard pattern: validate on blur (first time), then switch to real-time on-change after the first blur. RHF supports this with the mode: "onTouched" option.',
    },
    {
      q: 'How do you validate that two fields match (e.g. password + confirmPassword) in Zod?',
      options: ['z.same()', 'z.intersection()', '.refine(d => d.password === d.confirm, { path: ["confirm"] })', 'z.object({ password: z.ref("confirm") })'],
      answer: 2,
      explanation: '.refine() runs after all fields pass their individual rules. It receives the whole form object, so you can compare cross-field values. The path option maps the error to a specific field.',
    },
    {
      q: 'What does trigger(["email", "password"]) do in React Hook Form?',
      options: ['Submits only the listed fields', 'Programmatically validates the listed fields and returns a Promise<boolean>', 'Resets the listed fields to their default values', 'Watches the listed fields for changes'],
      answer: 1,
      explanation: 'trigger() manually runs validation for specific fields and returns a Promise that resolves to true if all pass. It\'s the mechanism for validating a subset of fields before advancing a multi-step form.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use React Hook Form for every form, or is plain useState fine?',
      a: 'Plain useState is fine for 1–2 fields. Once you have 3+ fields, validation logic, and submit state, RHF reduces boilerplate significantly and performs better. The rule of thumb: if you\'re reaching for validate(), touched, and submitting state, switch to RHF.',
    },
    {
      q: 'How do I reset a React Hook Form after successful submission?',
      a: 'Call reset() (destructured from useForm) after your submit logic completes. reset() clears all field values, errors, and the touched/dirty state. Pass a values object to reset to specific defaults: reset({ name: "" }).',
    },
    {
      q: 'Can I use Zod without React Hook Form?',
      a: 'Yes — call schema.safeParse(data) anywhere. If it fails, .error.issues gives you an array of validation errors with paths and messages. This is useful for validating API responses, URL params, or env variables.',
    },
    {
      q: 'How do I show a server-side validation error (e.g. "email already taken") in RHF?',
      a: 'Call setError("email", { type: "server", message: "Email already taken" }) inside the onSubmit handler after the API call fails. This adds the error to formState.errors.email like any other validation error.',
    },
    {
      q: 'What is the difference between formState.isDirty and formState.dirtyFields?',
      a: 'isDirty is true if any field differs from its defaultValues. dirtyFields is an object with a key for each field that has changed. Use isDirty to show "unsaved changes" warnings; use dirtyFields for patch-style partial updates (only send changed fields).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'React forms: controlled inputs for real-time UX, RHF + Zod for production — minimal re-renders and type-safe schema validation.',
    mustKnow: [
      'Controlled: value + onChange — React owns the input; uncontrolled: ref/FormData — DOM owns it; file inputs are always uncontrolled',
      'React Hook Form uses refs internally — no re-render per keystroke; errors trigger re-renders',
      'zodResolver bridges Zod and RHF: define schema once, get TypeScript type + runtime validation',
      'Cross-field validation (confirm password) uses .refine() on the schema root object',
      'z.coerce.number() is required for number inputs — HTML inputs always return strings',
      'Validate on blur, show errors after first touch, then switch to real-time — standard UX pattern',
    ],
    interviewFocus: [
      'What is the performance difference between React Hook Form and controlled inputs?',
      'How would you implement cross-field validation (e.g. password matching) with Zod?',
      'When would you use Controller vs register() in React Hook Form?',
      'How do you show a server-side validation error inside a React Hook Form?',
    ],
  };
}
