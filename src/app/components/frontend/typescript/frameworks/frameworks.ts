import { Component } from '@angular/core';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ts-frameworks',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './frameworks.html',
  styleUrl: './frameworks.scss',
})
export class TsFrameworks {
  quickRef: QuickRefItem[] = [
    { name: 'React.FC<Props>',           type: 'type',      desc: 'Functional component type — prefer (props: Props) => JSX.Element for cleaner inference' },
    { name: 'React.ReactNode',           type: 'type',      desc: 'Anything React can render: string, number, JSX, null, array — use for children prop' },
    { name: 'React.MouseEvent<T>',       type: 'type',      desc: 'Typed synthetic event — T is the HTML element (e.g. HTMLButtonElement)' },
    { name: 'useRef<T>',                 type: 'hook',      desc: 'useRef<HTMLInputElement>(null) — element ref; useRef<number>(0) — mutable value' },
    { name: 'useState<T>',               type: 'hook',      desc: 'Type inferred from initial value; pass generic when initial is null: useState<User | null>(null)' },
    { name: 'z.infer<typeof schema>',    type: 'type',      desc: 'Zod: extract TypeScript type from a runtime schema — single source of truth' },
    { name: 'Request (Express)',          type: 'type',      desc: 'Augment via declare module "express" { interface Request { user?: User } }' },
    { name: 'NextRequest',               type: 'type',      desc: 'Next.js App Router: extends Request with nextUrl, cookies, geo' },
    { name: 'ComponentProps<T>',         type: 'type',      desc: 'React: extract props type from a component — ComponentProps<typeof Button>' },
    { name: 'ReturnType<typeof handler>',type: 'type',      desc: 'Infer the return type of a route handler or server action without duplicating types' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'TypeScript with React — component typing patterns',
      points: [
        'The two ways to type a React functional component: <code>const Btn = (props: BtnProps) => JSX.Element</code> (preferred) or <code>const Btn: React.FC&lt;BtnProps&gt;</code>. Prefer the explicit props approach — <code>React.FC</code> implicitly added <code>children</code> prop in older React (removed in React 18\'s types), and it hides the component\'s return type.',
        'Props interfaces should be defined inline or just above the component. Use <code>interface</code> for extensible props, <code>type</code> for unions. For compound components (Card + Card.Header), use a namespace: <code>namespace Card { export interface HeaderProps { ... } }</code>.',
        'Event handlers: always annotate with the specific event type — <code>React.ChangeEvent&lt;HTMLInputElement&gt;</code>, <code>React.FormEvent&lt;HTMLFormElement&gt;</code>, <code>React.MouseEvent&lt;HTMLButtonElement&gt;</code>. This gives access to <code>event.target.value</code> with the correct type.',
        'The <code>children</code> prop: type it as <code>React.ReactNode</code> (broadest — anything renderable) or <code>React.ReactElement</code> (only JSX, no strings/null). For render props patterns, type children as a function: <code>children: (data: T) => React.ReactNode</code>.',
      ],
    },
    {
      heading: 'React hooks — typing useState, useRef, useCallback',
      points: [
        '<code>useState</code> infers the type from the initial value. When the initial value is <code>null</code> or <code>undefined</code>, provide the generic: <code>useState&lt;User | null&gt;(null)</code>. Without it, TypeScript infers <code>null</code> type only.',
        '<code>useRef</code> has two distinct usage patterns: (1) DOM ref: <code>useRef&lt;HTMLInputElement&gt;(null)</code> — starts as null, becomes the element after mount; (2) mutable value: <code>useRef&lt;number&gt;(0)</code> — mutable container that does not trigger re-render. The type determines which overload is returned.',
        '<code>useCallback</code> and <code>useMemo</code> infer types from the callback\'s return value. Explicit generics are rarely needed. For <code>useReducer</code>, define discriminated union action types: <code>type Action = { type: "increment" } | { type: "set"; payload: number }</code>.',
        'Custom hooks return types are inferred automatically. For hooks that return a tuple, annotate the return type explicitly or use <code>as const</code>: <code>return [value, setValue] as const</code> — otherwise TypeScript infers a union array instead of a tuple.',
      ],
    },
    {
      heading: 'TypeScript with Node.js and Express',
      points: [
        'Express types come from <code>@types/express</code>. The key types: <code>Request</code>, <code>Response</code>, <code>NextFunction</code>, <code>RequestHandler</code>. For typed route params: <code>Request&lt;{ id: string }&gt;</code>. For typed body: <code>Request&lt;{}, {}, CreateUserDto&gt;</code>.',
        'The most important pattern: augment <code>Request</code> to add custom properties set by middleware. Declare in a <code>.d.ts</code> file: <code>declare module "express" { interface Request { user?: AuthUser } }</code>. Now <code>req.user</code> is typed throughout the application.',
        'Type-safe route handlers: <code>const handler: RequestHandler&lt;Params, ResBody, ReqBody, Query&gt;</code>. All four generics are optional — provide only what you need. Validate request bodies with Zod and use <code>z.infer</code> to derive the TypeScript type.',
        'Environment variables: always wrap <code>process.env</code> access in a typed config module. Use Zod to validate and parse env vars at startup: if validation fails, throw immediately — don\'t let the app start with missing config. This catches misconfigured deployments at startup rather than at runtime.',
      ],
    },
    {
      heading: 'Zod — runtime validation with TypeScript inference',
      points: [
        'Zod is a schema validation library that generates TypeScript types from schemas. One schema is both the runtime validator and the compile-time type source. <code>z.infer&lt;typeof schema&gt;</code> extracts the TypeScript type — no manual interface duplication.',
        'The core workflow: define a Zod schema → infer the type → validate at system boundaries (API inputs, form submissions, env vars). TypeScript trusts the validated data because Zod narrows the type on success: <code>const result = schema.parse(data)</code> returns the typed value or throws.',
        'Safe parsing with <code>safeParse</code>: returns <code>{ success: true, data: T } | { success: false, error: ZodError }</code>. Use this for validation where you want to handle errors without try/catch. The discriminated union narrows correctly in both branches.',
        'Common Zod patterns: <code>z.object()</code> for DTOs, <code>z.enum()</code> for typed enums from schema, <code>z.discriminatedUnion()</code> for union types, <code>.transform()</code> for coercion (string to number), <code>.refine()</code> for custom validation with error messages.',
      ],
    },
    {
      heading: 'TypeScript with Next.js',
      points: [
        'Next.js App Router uses TypeScript natively. Page components receive typed <code>params</code> and <code>searchParams</code> props: <code>export default function Page({ params }: { params: { slug: string } })</code>. Route handlers export typed <code>GET</code>, <code>POST</code> functions with <code>NextRequest</code> and <code>NextResponse</code>.',
        'Server Actions are async functions marked with <code>"use server"</code>. Type them as returning <code>Promise&lt;{ success: boolean; data?: T; error?: string }&gt;</code>. Use Zod to validate the FormData input before processing.',
        '<code>generateMetadata</code> is a typed async function that returns <code>Metadata</code> from <code>next/metadata</code>. TypeScript enforces the metadata shape — no invalid fields.',
        'Common Next.js TypeScript pitfalls: <code>params</code> in dynamic routes must be typed per route — TypeScript does not enforce that the param names match the folder names (e.g. <code>[id]</code> must be manually typed as <code>{ id: string }</code>). Use a shared params type file for consistency.',
      ],
    },
    {
      heading: 'Environment variables — typed configuration',
      points: [
        'Never read <code>process.env.MY_VAR</code> directly throughout your code — it returns <code>string | undefined</code> and any typo compiles silently. Centralize all env access in one typed config module that validates at startup.',
        'The Zod approach: define a schema with <code>z.object({ DATABASE_URL: z.string().url(), PORT: z.coerce.number().default(3000) })</code>. Call <code>schema.parse(process.env)</code> at module load time. Export the result as <code>const env</code> — fully typed, never undefined.',
        'Vite exposes env vars as <code>import.meta.env.VITE_API_URL</code>. Extend the <code>ImportMetaEnv</code> interface in a <code>vite-env.d.ts</code> file to get autocomplete and type-safety for your custom env vars.',
        'Never commit real secrets to env files. The .d.ts or Zod schema describes the shape of env vars — documentation and type-safety combined. Use <code>.env.example</code> (committed) to show required keys; <code>.env</code> (gitignored) for actual values.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'React component & hook patterns',
      language: 'typescript',
      code: `import React, { useState, useRef, useCallback, useReducer } from 'react';

// Preferred: explicit props type, explicit return
interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}
const Button = ({ label, onClick, disabled, variant = 'primary' }: ButtonProps): React.ReactElement => (
  <button onClick={onClick} disabled={disabled} className={\`btn btn-\${variant}\`}>
    {label}
  </button>
);

// Children typing
interface CardProps {
  title: string;
  children: React.ReactNode; // broadest — string, JSX, null, arrays all valid
}
const Card = ({ title, children }: CardProps) => (
  <div className="card"><h2>{title}</h2>{children}</div>
);

// useState with nullable initial value:
const [user, setUser] = useState<{ id: string; name: string } | null>(null);
// setUser(null) and setUser({ id: '1', name: 'Alice' }) both valid

// useRef for DOM elements:
const inputRef = useRef<HTMLInputElement>(null);
const focusInput = () => inputRef.current?.focus(); // current is HTMLInputElement | null

// useRef for mutable value (no re-render):
const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

// Custom hook with tuple return (as const for proper tuple type):
function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(v => !v), []);
  return [on, toggle] as const; // without 'as const': (boolean | (() => void))[]
}

// useReducer with discriminated union actions:
type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number };
const counterReducer = (state: number, action: CounterAction): number => {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'reset':     return action.payload; // payload typed only on 'reset'
  }
};`,
    },
    {
      label: 'Express typed routes & middleware',
      language: 'typescript',
      code: `import express, { Request, Response, NextFunction, RequestHandler } from 'express';

// Module augmentation — add user to Request (in src/types/express.d.ts):
// import 'express';
// declare module 'express' {
//   interface Request {
//     user?: { id: string; email: string; roles: string[] };
//   }
// }

// Typed route params, body, response body:
interface CreateUserBody { name: string; email: string; }
interface UserParams     { id: string; }
interface UserResponse   { id: string; name: string; email: string; createdAt: Date; }

const getUser: RequestHandler<UserParams, UserResponse> = async (req, res) => {
  const { id } = req.params; // typed: string
  const user = await findUser(id);
  res.json(user); // TypeScript does NOT enforce res.json matches UserResponse — runtime only
};

const createUser: RequestHandler<{}, UserResponse, CreateUserBody> = async (req, res) => {
  const { name, email } = req.body; // typed: { name: string; email: string }
  const user = await saveUser({ name, email });
  res.status(201).json(user);
};

// Auth middleware — sets req.user:
const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  req.user = await verifyToken(token); // user is typed via module augmentation
  next();
};

const app = express();
app.use(express.json());
app.get('/users/:id', authenticate, getUser);
app.post('/users', authenticate, createUser);

// Stub functions for the example:
async function findUser(id: string): Promise<UserResponse> { return {} as UserResponse; }
async function saveUser(data: CreateUserBody): Promise<UserResponse> { return {} as UserResponse; }
async function verifyToken(t: string): Promise<{ id: string; email: string; roles: string[] }> { return {} as never; }`,
    },
    {
      label: 'Zod — runtime validation + TypeScript types',
      language: 'typescript',
      code: `import { z } from 'zod';

// Define schema once — get runtime validation + TypeScript type
const CreateUserSchema = z.object({
  name:     z.string().min(2).max(50),
  email:    z.string().email(),
  age:      z.number().int().min(18).optional(),
  role:     z.enum(['admin', 'user', 'viewer']).default('user'),
  address:  z.object({
    street: z.string(),
    city:   z.string(),
    zip:    z.string().regex(/^\\d{5}$/),
  }).optional(),
});

// Extract the TypeScript type — no manual interface needed:
type CreateUserDto = z.infer<typeof CreateUserSchema>;
// Equivalent to:
// interface CreateUserDto {
//   name: string; email: string; age?: number;
//   role: 'admin' | 'user' | 'viewer';
//   address?: { street: string; city: string; zip: string };
// }

// Safe parse — no try/catch, returns success/failure discriminated union:
function handleCreateUser(input: unknown) {
  const result = CreateUserSchema.safeParse(input);
  if (!result.success) {
    console.error(result.error.issues); // ZodIssue[]
    return null;
  }
  const dto: CreateUserDto = result.data; // fully typed
  return dto;
}

// Environment variables with Zod:
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT:         z.coerce.number().default(3000), // coerce: "3000" → 3000
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET:   z.string().min(32),
});

// Validate at startup — throw immediately if misconfigured:
export const env = EnvSchema.parse(process.env);
// env.PORT is number (not string | undefined), env.DATABASE_URL is string, etc.`,
    },
    {
      label: 'Next.js App Router types',
      language: 'typescript',
      code: `import { NextRequest, NextResponse } from 'next/server';
import type { Metadata } from 'next';

// Page component with typed params (dynamic route: app/blog/[slug]/page.tsx):
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}
export default async function BlogPage({ params, searchParams }: PageProps) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}

// Typed metadata:
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, images: [post.coverImage] },
  };
}

// Route handler (app/api/users/route.ts):
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? '1');
  const users = await fetchUsers(page);
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as unknown;
  const result = CreateUserSchema.safeParse(body); // Zod validation
  if (!result.success)
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  const user = await createUser(result.data);
  return NextResponse.json(user, { status: 201 });
}

// Server Action:
'use server';
async function submitForm(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const result = CreateUserSchema.safeParse(data);
  if (!result.success) return { error: result.error.message };
  await saveUser(result.data);
  return { success: true };
}

// Stub types for example:
declare function getPost(slug: string): Promise<{ title: string; content: string; excerpt: string; coverImage: string }>;
declare function fetchUsers(page: number): Promise<unknown[]>;
declare function createUser(data: unknown): Promise<unknown>;
declare function saveUser(data: unknown): Promise<void>;
declare const CreateUserSchema: { safeParse: (d: unknown) => { success: true; data: unknown } | { success: false; error: { message: string; issues: unknown[] } } };`,
    },
    {
      label: 'Vite env vars & ComponentProps utility',
      language: 'typescript',
      code: `// Vite env type augmentation — vite-env.d.ts (or src/env.d.ts):
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL:    string;
  readonly VITE_APP_TITLE:  string;
  readonly VITE_FEATURE_X:  string; // 'true' | 'false' (env vars are always strings)
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// Now: import.meta.env.VITE_API_URL is typed string (not string | undefined)

// React.ComponentProps — extract props type from an existing component:
import type { ComponentProps } from 'react';

function Button({ className, ...props }: ComponentProps<'button'> & { variant?: string }) {
  return <button className={\`btn \${className ?? ''}\`} {...props} />;
}

// ComponentProps<typeof MyComponent> — extract custom component's props:
import type { FC } from 'react';
const Card: FC<{ title: string; body: string }> = ({ title, body }) => (
  <div><h2>{title}</h2><p>{body}</p></div>
);
type CardProps = ComponentProps<typeof Card>; // { title: string; body: string }

// Generic API response wrapper — reusable type for all endpoints:
interface ApiResponse<T> {
  data:    T;
  meta:    { page: number; total: number; perPage: number };
  status:  'ok' | 'error';
  message?: string;
}
type UsersResponse = ApiResponse<User[]>;
type UserResponse  = ApiResponse<User>;

interface User { id: string; name: string; email: string; }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using React.FC<Props> and expecting children to be auto-typed',
      wrong: `// React 17 and earlier: React.FC added children prop implicitly
const Card: React.FC<{ title: string }> = ({ title, children }) => (
  <div><h2>{title}</h2>{children}</div>
);
// React 18+: React.FC no longer adds children — the code above errors!
// Property 'children' does not exist on type '{ title: string }'`,
      right: `// Explicit children — works across all React versions:
interface CardProps {
  title: string;
  children: React.ReactNode;
}
const Card = ({ title, children }: CardProps): React.ReactElement => (
  <div><h2>{title}</h2>{children}</div>
);

// Or with React 18's PropsWithChildren:
import type { PropsWithChildren } from 'react';
const Card = ({ title, children }: PropsWithChildren<{ title: string }>) => (
  <div><h2>{title}</h2>{children}</div>
);`,
      explanation: 'React.FC implicitly added a children prop in React 17 and earlier types. React 18 removed this — components no longer accept children unless explicitly typed. Always declare children: React.ReactNode explicitly, or use PropsWithChildren<YourProps>.',
    },
    {
      title: 'Typing useState with null initial value incorrectly',
      wrong: `// TypeScript infers 'null' type — cannot set a real user later:
const [user, setUser] = useState(null);
setUser({ id: '1', name: 'Alice' }); // Error: type '{ id: string; name: string }' is not assignable to 'null'`,
      right: `// Provide the generic when initial value doesn't reflect the real type:
interface User { id: string; name: string; }
const [user, setUser] = useState<User | null>(null);
setUser({ id: '1', name: 'Alice' }); // OK
setUser(null);                        // OK — can clear

// If you always have an initial value, inference works fine:
const [count, setCount] = useState(0); // inferred: number
const [name, setName]   = useState(''); // inferred: string`,
      explanation: 'useState infers its type from the initial value. When you pass null, TypeScript infers the type as null — a state that can never hold a real value. Always provide the generic type parameter when the state will hold a non-null value later.',
    },
    {
      title: 'Reading process.env directly throughout the app (untyped, unsafe)',
      wrong: `// Scattered throughout the codebase — no type safety, no validation:
const url = process.env.DATABASE_URL; // string | undefined — could be missing
const port = Number(process.env.PORT); // NaN if PORT is undefined!
fetch(process.env.API_URL + '/users'); // could be undefined — runtime crash`,
      right: `// Centralized, Zod-validated config module (src/config.ts):
import { z } from 'zod';
const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT:         z.coerce.number().default(3000),
  API_URL:      z.string().url(),
});
export const config = schema.parse(process.env);
// Throws at startup if any required var is missing — not in production at 3am

// Usage everywhere else — fully typed, never undefined:
fetch(config.API_URL + '/users'); // config.API_URL is string
const port: number = config.PORT; // number, not string | undefined`,
      explanation: 'process.env returns string | undefined for every key. Reading it directly spreads nullability throughout the codebase and buries validation at the point of use. Centralize env access in a single module that validates at startup — the app fails immediately if misconfigured, not silently in production.',
    },
    {
      title: 'Using `any` for request body in Express routes',
      wrong: `app.post('/users', async (req, res) => {
  const { name, email } = req.body; // req.body is 'any' — no type checking
  // Can misspell 'email' as 'emal' — TypeScript won't catch it
  await createUser(name, email);
});`,
      right: `import { z } from 'zod';
const CreateUserSchema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
});
type CreateUserDto = z.infer<typeof CreateUserSchema>;

app.post('/users', async (req: Request<{}, {}, CreateUserDto>, res) => {
  // Option 1: trust the generic (no runtime validation — risky):
  const { name, email } = req.body; // typed by generic

  // Option 2: validate at the boundary (recommended):
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues }); return; }
  const { name: n, email: e } = result.data; // typed AND validated
  await createUser(n, e);
});`,
      explanation: 'Express req.body is typed as any by default. TypeScript type assertions or generics on Request<> give you types without validation — a malicious or buggy client can still send unexpected data. Validate at the boundary with Zod (or class-validator) to get both runtime safety and TypeScript types from one schema.',
    },
    {
      title: 'Custom hook returning tuple inferred as union array',
      wrong: `function useCounter(initial: number) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  return [count, increment]; // inferred: (number | (() => void))[] — not a tuple!
}
const [count, increment] = useCounter(0);
count.toFixed(2); // Error: toFixed does not exist on number | (() => void)`,
      right: `// Option 1: explicit return type annotation:
function useCounter(initial: number): [number, () => void] {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  return [count, increment];
}

// Option 2: as const (const assertion preserves tuple type):
function useCounter(initial: number) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  return [count, increment] as const; // readonly [number, () => void]
}

const [count, increment] = useCounter(0);
count.toFixed(2); // OK — count is number`,
      explanation: 'TypeScript infers array literals as arrays, not tuples. A hook returning [value, setter] without an explicit type gets inferred as (T | Setter)[]. Use `as const` to get a readonly tuple type, or annotate the return type explicitly. Both work — as const is less typing.',
    },
    {
      title: 'Augmenting Express Request in a .ts file instead of a .d.ts file',
      wrong: `// src/middleware/auth.ts — adding augmentation inside a .ts file
declare module 'express' {
  interface Request { user?: AuthUser; }
}
// This only applies when auth.ts is imported — if another file doesn't import
// auth.ts, req.user is typed as 'any' or doesn't exist`,
      right: `// src/types/express.d.ts — dedicated declaration file, always included
import 'express';
declare module 'express' {
  interface Request {
    user?: { id: string; email: string; roles: string[] };
    correlationId?: string;
  }
}
// tsconfig.json includes src/** — this file is always picked up
// req.user is typed everywhere, not just where auth.ts is imported`,
      explanation: 'Module augmentations inside .ts files are only active when that file is part of the compilation AND imported. Putting augmentations in a dedicated .d.ts file (included by tsconfig) ensures they are always available — no import required, no surprising "req.user is not defined" type errors in other files.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a type-safe API client with Zod validation',
    language: 'typescript',
    description: 'Create a typed ApiClient class that makes HTTP requests and validates responses with Zod schemas. The client should have a get<T>(url, schema) and post<T>(url, body, schema) method. Both methods should return the validated, typed data or throw a descriptive error if validation fails.',
    hints: [
      'Use z.ZodType<T> as the schema parameter type — accepts any Zod schema that outputs T',
      'The return type of get<T>(url, schema: z.ZodType<T>) should be Promise<T>',
      'Use schema.parse() to validate the response — it throws ZodError on failure',
      'Wrap fetch errors and ZodErrors in a custom ApiError class with a message and optional cause',
    ],
    starterCode: `import { z } from 'zod';

// TODO: implement ApiClient with get() and post() methods

// Schemas:
const UserSchema = z.object({
  id:    z.string(),
  name:  z.string(),
  email: z.string().email(),
});
const UsersSchema = z.array(UserSchema);
type User = z.infer<typeof UserSchema>;

// Usage should be fully typed:
const client = new ApiClient('https://api.example.com');
const users: User[] = await client.get('/users', UsersSchema);
const user: User    = await client.post('/users', { name: 'Alice', email: 'alice@example.com' }, UserSchema);`,
    solution: `import { z } from 'zod';

class ApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.baseUrl + path);
    } catch (e) {
      throw new ApiError(\`Network error fetching \${path}\`, e);
    }
    if (!response.ok) {
      throw new ApiError(\`HTTP \${response.status} fetching \${path}\`);
    }
    const json = await response.json() as unknown;
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new ApiError(\`Invalid response shape for \${path}: \${result.error.message}\`, result.error);
    }
    return result.data;
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new ApiError(\`Network error posting to \${path}\`, e);
    }
    if (!response.ok) {
      throw new ApiError(\`HTTP \${response.status} posting to \${path}\`);
    }
    const json = await response.json() as unknown;
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new ApiError(\`Invalid response shape for POST \${path}: \${result.error.message}\`, result.error);
    }
    return result.data;
  }
}

// Usage — fully typed:
const UserSchema = z.object({ id: z.string(), name: z.string(), email: z.string().email() });
const UsersSchema = z.array(UserSchema);
type User = z.infer<typeof UserSchema>;

const client = new ApiClient('https://api.example.com');
// return type is User[] — inferred from schema
const users: User[] = await client.get('/users', UsersSchema);
// return type is User — inferred from schema
const user: User = await client.post('/users', { name: 'Alice', email: 'alice@example.com' }, UserSchema);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What changed about React.FC in React 18 that makes it problematic?',
      options: [
        'React.FC was removed entirely in React 18',
        'React.FC no longer implicitly includes the children prop — components must declare children explicitly',
        'React.FC now requires a return type annotation',
        'React.FC only works with class components in React 18',
      ],
      answer: 1,
      explanation: 'Prior to React 18, React.FC automatically added a children?: ReactNode prop to every component. React 18 removed this implicit children prop. If your component accepts children, you must now declare it explicitly in your props interface, or use React.PropsWithChildren<YourProps>.',
    },
    {
      q: 'Why must you provide a generic to useState when the initial value is null?',
      options: [
        'TypeScript requires generics for all useState calls',
        'useState(null) infers the type as null — you cannot set any non-null value later without the generic',
        'null is not a valid initial value for useState',
        'Without the generic, useState returns undefined instead of null',
      ],
      answer: 1,
      explanation: 'TypeScript infers useState\'s type from the initial value. With useState(null), the inferred type is null — a state variable that can only ever be null. To allow non-null values, you must provide the generic: useState<User | null>(null) tells TypeScript the state holds User | null.',
    },
    {
      q: 'What does `z.infer<typeof schema>` do in Zod?',
      options: [
        'Runs the schema validation at runtime',
        'Creates a new Zod schema from a TypeScript type',
        'Extracts the TypeScript type that the schema represents — eliminates manual interface duplication',
        'Converts a Zod schema to a JSON Schema',
      ],
      answer: 2,
      explanation: 'z.infer<typeof schema> extracts the TypeScript type that a Zod schema describes. This gives you both runtime validation and compile-time types from a single schema definition. No need to maintain a separate interface that might drift from the validation rules.',
    },
    {
      q: 'What is the recommended approach for typing environment variables in a Node.js app?',
      options: [
        'Add process.env.MY_VAR to a global .d.ts file as string',
        'Read process.env directly but wrap in a type assertion: process.env.URL as string',
        'Centralize in a config module that validates with Zod at startup and exports fully-typed values',
        'Use a third-party secrets manager instead of environment variables',
      ],
      answer: 2,
      explanation: 'A centralized config module with Zod validation at startup provides type-safe access (values are string, not string | undefined) and fails fast if required env vars are missing — at startup, not in production at runtime when a feature is first used.',
    },
    {
      q: 'How should you type a custom React hook that returns a [value, setter] tuple?',
      options: [
        'React automatically types tuples from hooks correctly',
        'Return the tuple as-is — TypeScript infers it correctly',
        'Use "as const" on the return or annotate the return type explicitly — otherwise TypeScript infers a union array',
        'Wrap the tuple in an object: return { value, setter }',
      ],
      answer: 2,
      explanation: 'TypeScript infers array literals as arrays (T | U)[], not as tuples [T, U]. A hook returning [value, setter] without `as const` or an explicit return type gets type (number | (() => void))[], making destructuring ambiguous. Either annotate the return type or use `return [value, setter] as const`.',
    },
    {
      q: 'In Next.js App Router, how do you type a dynamic route page\'s params?',
      options: [
        'Next.js automatically infers params from the folder name — no typing needed',
        'Use the params prop with an explicit type matching the folder structure: { params: { slug: string } }',
        'Params are always typed as Record<string, string> — no custom typing needed',
        'Use the PageProps type from next/types which automatically includes correct param types',
      ],
      answer: 1,
      explanation: 'Next.js does not automatically infer param names from the folder structure into TypeScript types. You must explicitly type the params prop to match your route structure: for app/blog/[slug]/page.tsx, declare { params: { slug: string } }. The framework provides the values at runtime; TypeScript enforces the shape at compile time.',
    },
    {
      q: 'Where should Express Request module augmentation (adding req.user) be placed?',
      options: [
        'Inside the auth middleware file — it is only needed when auth runs',
        'In a dedicated .d.ts file included by tsconfig — ensures it is always available project-wide',
        'In the main entry point file (index.ts or app.ts)',
        'In node_modules/@types/express/index.d.ts — edit the installed types directly',
      ],
      answer: 1,
      explanation: 'Module augmentation inside .ts files is conditional on that file being imported. Placing it in a dedicated .d.ts file (like src/types/express.d.ts) that is included by tsconfig ensures req.user is typed in every route handler automatically — no import of the auth file needed. Never edit node_modules directly.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between React.ReactNode and React.ReactElement?',
      a: 'ReactNode is the broadest type — it includes JSX elements, strings, numbers, null, undefined, booleans, and arrays of these. Use it for the children prop when you want to accept anything renderable. ReactElement is specifically a JSX element object (the result of React.createElement). Use ReactElement when you need to guarantee the child is actual JSX, not a string or null.',
    },
    {
      q: 'How do I type a ref that might be null initially but is set after mount?',
      a: 'Use useRef<HTMLElement>(null) — the generic is the element type, the initial value is null. TypeScript types the ref as React.RefObject<HTMLElement> where current is HTMLElement | null. Before accessing ref.current, guard with if (ref.current) or use optional chaining ref.current?.method(). After mount, React sets current to the DOM element; at unmount, it resets to null.',
    },
    {
      q: 'When should I use Zod vs writing manual TypeScript interfaces?',
      a: 'Use Zod whenever the data comes from outside your TypeScript code — API responses, form inputs, environment variables, URL params, localStorage, file reads. These need runtime validation that TypeScript types cannot provide. Use plain interfaces for internal data structures that never cross a system boundary. Zod gives you both runtime validation and TypeScript types from one declaration — zero duplication.',
    },
    {
      q: 'How do I extend the Vite ImportMetaEnv for custom environment variables?',
      a: 'Create or edit src/vite-env.d.ts. Add a triple-slash reference to vite/client, then augment the ImportMetaEnv interface with your custom vars: interface ImportMetaEnv { readonly VITE_API_URL: string; }. Add interface ImportMeta { readonly env: ImportMetaEnv; } to connect the two. After this, import.meta.env.VITE_API_URL is typed as string (not string | undefined) in the IDE.',
    },
    {
      q: 'Can I use TypeScript generics in Next.js page components?',
      a: 'Not directly for page files — Next.js page components have a fixed signature that the framework calls. However, you can use generics in the helper functions and sub-components used by the page. For reusable layout components that accept generic data, write them as generic React components and instantiate them with concrete types in the page file.',
    },
    {
      q: 'How do I type a shared API response wrapper that works for all endpoints?',
      a: 'Define a generic interface: interface ApiResponse<T> { data: T; status: "ok" | "error"; meta?: { total: number; page: number }; }. Then create specific types by instantiating the generic: type UsersResponse = ApiResponse<User[]>; type UserResponse = ApiResponse<User>. This gives you a consistent envelope with per-endpoint typed data without repetition.',
    },
    {
      q: 'What is React.ComponentProps<T> and when is it useful?',
      a: 'ComponentProps<T> extracts the props type of a component. For HTML elements: ComponentProps<"button"> gives you all native button HTML attributes — useful for wrapper components that spread props. For custom components: ComponentProps<typeof MyCard> gives you the component\'s own props type without importing the interface separately. It updates automatically if the component\'s props change.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript with frameworks: prefer explicit props over React.FC (children not implicit in React 18), useState<T|null>(null) for nullable state, useRef<El>(null) for DOM refs, Zod for runtime validation + type inference at boundaries, centralized env config, and Express Request augmentation in .d.ts files.',
    mustKnow: [
      'React 18: React.FC no longer adds children — declare children: React.ReactNode explicitly',
      'useState(null) infers null type — provide generic useState<User|null>(null) for nullable state',
      'useRef<HTMLInputElement>(null): DOM ref; useRef<number>(0): mutable value — different overloads',
      'Custom hooks returning tuples: use `as const` or explicit return type — else inferred as union array',
      'Zod z.infer<typeof schema>: single source of truth for runtime validation and TypeScript types',
      'Express req.body is any — validate with Zod at the route boundary, not with type assertions',
      'Module augmentation (req.user): put in .d.ts file included by tsconfig — not inside .ts middleware',
    ],
    interviewFocus: [
      'How do you type a nullable useState — why does useState(null) not work?',
      'What is the difference between ReactNode and ReactElement?',
      'How do you validate environment variables in a type-safe way?',
      'What does Zod\'s z.infer do and why is it better than a separate interface?',
      'How do you add req.user to Express Request type — where should the augmentation go?',
    ],
  };
}
