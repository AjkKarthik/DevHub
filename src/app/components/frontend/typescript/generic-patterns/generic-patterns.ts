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
  selector: 'app-ts-generic-patterns',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './generic-patterns.html',
  styleUrl: './generic-patterns.scss',
})
export class TsGenericPatterns {
  quickRef: QuickRefItem[] = [
    { name: 'Result<T, E>',            type: 'type',       desc: 'Discriminated union for success/failure — avoids try/catch, models errors as types' },
    { name: 'Option<T>',               type: 'type',       desc: 'Explicit nullable wrapper — { some: true; value: T } | { some: false }' },
    { name: 'Builder<T>',              type: 'class',      desc: 'Fluent builder pattern — generic accumulation of required properties before build()' },
    { name: 'Repository<T>',           type: 'interface',  desc: 'Generic CRUD interface — findById, findAll, save, delete typed per entity' },
    { name: 'DeepReadonly<T>',         type: 'type',       desc: 'Recursively apply Readonly — prevents deep mutation with mapped + conditional types' },
    { name: 'Awaited<T>',              type: 'type',       desc: 'Unwrap a Promise<T> to T — built-in since TS 4.5' },
    { name: 'ReturnType<typeof fn>',   type: 'type',       desc: 'Extract the return type of a function without declaring it separately' },
    { name: 'InstanceType<typeof C>',  type: 'type',       desc: 'Extract the instance type from a class constructor' },
    { name: 'Parameters<typeof fn>',   type: 'type',       desc: 'Extract the parameter types of a function as a tuple' },
    { name: 'ConstructorParameters<C>', type: 'type',      desc: 'Extract the constructor parameter types of a class as a tuple' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Result<T, E> — typed error handling without try/catch',
      points: [
        'The Result pattern models success and failure as types instead of using exceptions: <code>type Result&lt;T, E = string&gt; = { ok: true; value: T } | { ok: false; error: E }</code>. The caller is forced to handle both cases — the error cannot be ignored.',
        'Functions return <code>Result&lt;T, E&gt;</code> instead of throwing. Callers destructure with <code>if (result.ok)</code> to access <code>result.value</code> (TypeScript narrows the type) or <code>result.error</code> (when not ok). No try/catch needed at the call site.',
        'The default type parameter <code>E = string</code> makes the common case (string error message) concise, while still allowing structured errors: <code>Result&lt;User, HttpError&gt;</code>.',
        'This pattern is popular in domain layers where errors are expected business conditions, not exceptional events. It makes error paths visible in function signatures and ensures they are handled at compile time.',
      ],
    },
    {
      heading: 'Builder pattern with generics — compile-time required fields',
      points: [
        'The generic builder accumulates type information as methods are called. A phantom type parameter tracks which fields have been set: <code>class QueryBuilder&lt;TFields extends Partial&lt;Required&lt;Config&gt;&gt;&gt;</code>. The build() method is only available when TFields satisfies the full Required&lt;Config&gt; type.',
        'Each setter method returns a new builder with an updated generic parameter using intersection: <code>set(key: K, val: V): Builder&lt;T &amp; Record&lt;K, V&gt;&gt;</code>. The type parameter grows with each call.',
        'This prevents calling <code>build()</code> before all required fields are set — a compile-time guarantee instead of a runtime throw. The ergonomics are excellent: IDE autocomplete shows which fields remain.',
        'A simpler version just uses a plain generic with optional/required split: <code>class Builder&lt;TRequired, TOptional&gt;</code>. The build() method signature includes <code>TRequired extends Required&lt;TRequired&gt;</code> as a constraint.',
      ],
    },
    {
      heading: 'Generic repository and service patterns',
      points: [
        'The Repository pattern with generics provides a consistent CRUD interface for any entity: <code>interface Repository&lt;T, TId = string&gt; { findById(id: TId): Promise&lt;T | null&gt;; ... }</code>. Implementations are swappable (in-memory vs database).',
        'A base generic class can implement common logic: <code>abstract class BaseRepository&lt;T extends { id: string }&gt; implements Repository&lt;T&gt;</code>. Concrete subclasses add entity-specific queries.',
        'Generic services wrap repositories: <code>class CrudService&lt;T extends { id: string }, TCreate = Omit&lt;T, "id"&gt;&gt;</code>. The <code>TCreate</code> default uses Omit to strip the id (assigned by the database) from the create payload.',
        'This pattern is the backbone of NestJS and similar frameworks — TypeORM\'s <code>Repository&lt;Entity&gt;</code> and Angular\'s <code>HttpClient</code> use the same idea.',
      ],
    },
    {
      heading: 'DeepReadonly and recursive generic types',
      points: [
        'Utility types like <code>Readonly&lt;T&gt;</code> only apply one level deep. For deep immutability: <code>type DeepReadonly&lt;T&gt; = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly&lt;T[K]&gt; : T[K] }</code>. The conditional type recurses into nested objects.',
        'Recursive generic types are powerful but can cause infinite recursion. TypeScript limits depth. For most cases (config objects, domain types) the recursion terminates naturally. Arrays and tuples need special handling: check <code>T[K] extends unknown[]</code> first.',
        'Other recursive patterns: <code>type DeepPartial&lt;T&gt;</code>, <code>type Flatten&lt;T&gt;</code>, <code>type JSONValue</code>. These are advanced utility types that combine mapped types and conditional types.',
        'Built-in <code>Readonly&lt;T&gt;</code>, <code>Partial&lt;T&gt;</code>, <code>Required&lt;T&gt;</code> are all non-recursive. DeepReadonly is typically hand-written or imported from a utility library (ts-essentials, type-fest).',
      ],
    },
    {
      heading: 'Extracting types from existing code — ReturnType, Parameters, etc.',
      points: [
        '<code>ReturnType&lt;typeof fn&gt;</code> extracts the return type of a function without declaring it. Useful when the return type is complex and you want to derive it rather than duplicate it: <code>type UserResult = ReturnType&lt;typeof getUser&gt;</code>.',
        '<code>Parameters&lt;typeof fn&gt;</code> gives the parameter types as a tuple: <code>Parameters&lt;typeof log&gt;</code> → <code>[msg: string, level: LogLevel]</code>. Use it to wrap functions without repeating types.',
        '<code>Awaited&lt;T&gt;</code> (TypeScript 4.5+) unwraps <code>Promise&lt;T&gt;</code> to <code>T</code>, and handles nested promises. <code>Awaited&lt;Promise&lt;string&gt;&gt;</code> is <code>string</code>. Essential for async function return types.',
        '<code>InstanceType&lt;typeof MyClass&gt;</code> gives the instance type. Useful when you need the instance type of a class without creating one: <code>type UserRepo = InstanceType&lt;typeof UserRepository&gt;</code>.',
      ],
    },
    {
      heading: 'Generic utilities with conditional types — Flatten, DeepPartial',
      points: [
        'Conditional types combined with generics enable structural type transformations: <code>type Flatten&lt;T&gt; = T extends Array&lt;infer Item&gt; ? Item : T</code>. <code>Flatten&lt;string[]&gt;</code> is <code>string</code>; <code>Flatten&lt;number&gt;</code> is <code>number</code>.',
        'The <code>infer</code> keyword declares a type variable inside a conditional extends clause: <code>T extends Promise&lt;infer R&gt; ? R : never</code>. R is bound to the resolved type when T is a Promise.',
        'Distributive conditional types automatically distribute over union types: <code>type IsString&lt;T&gt; = T extends string ? true : false</code>. <code>IsString&lt;string | number&gt;</code> → <code>true | false</code> (applied to each member).',
        'Use <code>[T] extends [string]</code> (tuple wrapping) to opt out of distribution when you want to check the whole union at once.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Result<T, E> Pattern',
      language: 'typescript',
      code: `// Result type — model errors in the type system
type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

// Helper constructors
const ok  = <T>(value: T): Result<T, never> => ({ ok: true,  value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Use in a function — no throwing
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) return err(\`HTTP \${res.status}\`);
    return ok(await res.json() as User);
  } catch (e) {
    return err((e as Error).message);
  }
}

// Consuming — forced to handle both paths
const result = await fetchUser('1');
if (result.ok) {
  console.log(result.value.name); // User — narrowed by ok: true
} else {
  console.error(result.error);    // string — narrowed by ok: false
}

// Chain results without try/catch
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (val: T) => U
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
const nameResult = mapResult(result, user => user.name); // Result<string, string>`,
    },
    {
      label: 'Generic Repository',
      language: 'typescript',
      code: `// Generic entity constraint — all entities have an id
interface Entity { id: string }

// Generic repository interface
interface Repository<T extends Entity, TCreate = Omit<T, 'id'>> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string, patch: Partial<TCreate>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// In-memory implementation (test double)
class InMemoryRepository<T extends Entity, TCreate = Omit<T, 'id'>>
  implements Repository<T, TCreate>
{
  protected store = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }
  async findAll(filter?: Partial<T>): Promise<T[]> {
    const items = [...this.store.values()];
    if (!filter) return items;
    return items.filter(item =>
      (Object.keys(filter) as (keyof T)[]).every(k => item[k] === filter[k])
    );
  }
  async create(data: TCreate): Promise<T> {
    const entity = { ...(data as object), id: crypto.randomUUID() } as T;
    this.store.set(entity.id, entity);
    return entity;
  }
  async update(id: string, patch: Partial<TCreate>): Promise<T | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.store.set(id, updated);
    return updated;
  }
  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

// Concrete usage
interface User extends Entity { name: string; email: string }
class UserRepository extends InMemoryRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    for (const u of this.store.values()) if (u.email === email) return u;
    return null;
  }
}`,
    },
    {
      label: 'DeepReadonly & Recursive Types',
      language: 'typescript',
      code: `// DeepReadonly — recurse into nested objects
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

interface Config {
  db: { host: string; port: number; credentials: { user: string; pass: string } };
  server: { port: number; cors: string[] };
}

const config: DeepReadonly<Config> = {
  db:     { host: 'localhost', port: 5432, credentials: { user: 'app', pass: 'secret' } },
  server: { port: 3000, cors: ['https://example.com'] },
};
// config.db.port = 5433;                    // Error — readonly
// config.db.credentials.pass = 'newpass';   // Error — deep readonly
// config.server.cors.push('http://evil.com'); // Error — ReadonlyArray

// DeepPartial — all properties optional recursively
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Useful for update/patch payloads that can set nested properties
type ConfigPatch = DeepPartial<Config>;
const patch: ConfigPatch = { db: { port: 5433 } }; // only what changes`,
    },
    {
      label: 'Type Extraction Utilities',
      language: 'typescript',
      code: `// ReturnType — extract without redeclaring
async function getUser(id: string) {
  return { id, name: 'Alice', role: 'admin' as const };
}
type UserDTO = Awaited<ReturnType<typeof getUser>>;
// { id: string; name: string; role: 'admin' }

// Parameters — wrap a function without repeating types
function sendEmail(to: string, subject: string, body: string): Promise<void> {
  return Promise.resolve();
}
type EmailArgs = Parameters<typeof sendEmail>; // [string, string, string]
function scheduledEmail(...args: EmailArgs): void {
  setTimeout(() => sendEmail(...args), 1000);
}

// InstanceType — get class instance type
class EventEmitter<T extends Record<string, unknown[]>> {
  on<K extends keyof T>(event: K, cb: (...args: T[K]) => void): this { return this; }
}
type Emitter = InstanceType<typeof EventEmitter<{ click: [x: number, y: number] }>>;

// ConstructorParameters
class DatabaseConnection {
  constructor(public url: string, public poolSize: number, public ssl: boolean) {}
}
type DBArgs = ConstructorParameters<typeof DatabaseConnection>; // [string, number, boolean]

function createPool(factory: typeof DatabaseConnection, ...args: DBArgs) {
  return new factory(...args);
}
createPool(DatabaseConnection, 'postgres://...', 10, true);`,
    },
    {
      label: 'Flatten & Conditional Generics',
      language: 'typescript',
      code: `// Flatten — unwrap array one level
type Flatten<T> = T extends Array<infer Item> ? Item : T;
type A = Flatten<string[]>;    // string
type B = Flatten<number>;      // number (non-array passthrough)
type C = Flatten<string[][]>;  // string[] (only one level deep)

// UnwrapPromise — using infer
type Unwrap<T> = T extends Promise<infer R> ? R : T;
type D = Unwrap<Promise<User>>;  // User
type E = Unwrap<string>;         // string

// Distributive conditional — applies to each union member
type IsArray<T> = T extends unknown[] ? 'yes' : 'no';
type F = IsArray<string | number[]>; // 'no' | 'yes'

// Non-distributive — wrap in tuple to check whole union
type IsArrayWhole<T> = [T] extends [unknown[]] ? 'yes' : 'no';
type G = IsArrayWhole<string | number[]>; // 'no' (string | number[] is not assignable to unknown[])

// Practical: extract only function keys from an object type
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

interface Service {
  id: string;
  name: string;
  fetch(): Promise<void>;
  save(data: unknown): boolean;
}
type ServiceMethods = FunctionKeys<Service>; // 'fetch' | 'save'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Throwing instead of returning Result — hidden error paths',
      wrong: `async function parseConfig(raw: string): Promise<Config> {
  const data = JSON.parse(raw); // throws on invalid JSON — silent at call site
  if (!isConfig(data)) throw new Error('Invalid config');
  return data;
}
// Callers forget try/catch — error swallowed or crashes the app`,
      right: `async function parseConfig(raw: string): Promise<Result<Config>> {
  try {
    const data = JSON.parse(raw);
    if (!isConfig(data)) return { ok: false, error: 'Invalid config shape' };
    return { ok: true, value: data };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}
// Caller forced to check result.ok — error path is visible in the type`,
      explanation: 'Throwing exceptions hides error paths from the type system. Callers have no type-level reminder to handle failures. Result<T, E> makes error paths first-class — ignoring them is a type error.',
    },
    {
      title: 'Returning the whole entity when only a subset is needed',
      wrong: `interface User { id: string; name: string; email: string; passwordHash: string }
async function getUser(id: string): Promise<User> {
  return db.findUser(id); // returns passwordHash to the caller — data leak risk
}`,
      right: `type PublicUser = Omit<User, 'passwordHash'>;
async function getUser(id: string): Promise<PublicUser | null> {
  const user = await db.findUser(id);
  if (!user) return null;
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}`,
      explanation: 'Returning the full entity including sensitive fields is a data leak risk. Use Omit<T, "sensitiveField"> to build a safe public type, and destructure to strip the field at the boundary.',
    },
    {
      title: 'Losing type safety by casting the builder result',
      wrong: `class QueryBuilder {
  private config: any = {};
  set(key: string, val: any): this { this.config[key] = val; return this; }
  build(): any { return this.config; } // loses all type info
}
const q = new QueryBuilder().set('table', 'users').build();
q.nonExistentField; // no error — it is any`,
      right: `class QueryBuilder<T extends Record<string, unknown> = Record<string, never>> {
  private config = {} as T;
  set<K extends string, V>(key: K, val: V): QueryBuilder<T & Record<K, V>> {
    return Object.assign(new QueryBuilder(), { config: { ...this.config, [key]: val } });
  }
  build(): T { return this.config; }
}
const q = new QueryBuilder().set('table', 'users').set('limit', 10).build();
q.table; // string — typed!
q.limit; // number — typed!`,
      explanation: 'A builder using any loses all type information. A generic builder that accumulates the type as you add fields provides full type safety at build() time — autocompletion shows exactly what was set.',
    },
    {
      title: 'Not making TCreate a separate generic — inflexible repository',
      wrong: `interface Repository<T extends { id: string }> {
  create(data: T): Promise<T>; // requires id on create — db should generate it
}`,
      right: `interface Repository<T extends { id: string }, TCreate = Omit<T, 'id'>> {
  create(data: TCreate): Promise<T>; // TCreate omits id by default
}`,
      explanation: 'The id is typically generated by the database on insert. Accepting the full T on create() forces callers to provide an id, which is wrong. A separate TCreate parameter (defaulting to Omit<T, "id">) solves this cleanly.',
    },
    {
      title: 'Using DeepReadonly incorrectly — forgetting arrays',
      wrong: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
// Arrays are objects — DeepReadonly<string[]> becomes DeepReadonly<string[]>
// which is { readonly [K in keyof string[]]: ... } — not ReadonlyArray<string>!`,
      right: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>  // arrays handled first
    : T[K] extends object
    ? DeepReadonly<T[K]>              // then other objects
    : T[K];
};`,
      explanation: 'Arrays are objects — checking extends object first misclassifies arrays. Always check extends (infer U)[] (array check) before extends object in recursive mapped types.',
    },
    {
      title: 'Using ReturnType on async functions without Awaited',
      wrong: `async function loadUser(id: string) {
  return { id, name: 'Alice' };
}
type User = ReturnType<typeof loadUser>; // Promise<{ id: string; name: string }> — not the inner type!`,
      right: `type User = Awaited<ReturnType<typeof loadUser>>; // { id: string; name: string }`,
      explanation: 'ReturnType of an async function is Promise<T> — you need Awaited<ReturnType<...>> to get the resolved value type T. This is a very common mistake when extracting types from async functions.',
    },
  ];

  challenge: Challenge = {
    title: 'Generic pipeline builder',
    language: 'typescript',
    description: 'Implement a type-safe Pipeline<TIn, TOut> that chains transformation steps. Each step receives the output of the previous step. The pipeline must enforce at compile time that consecutive steps have compatible types — the output of step N must match the input of step N+1. Implement pipe(fn) to add a step and run(input) to execute.',
    hints: [
      'Pipeline<TIn, TOut> tracks the input type of the first step and the output type of the last step',
      'pipe<TNext>(fn: (val: TOut) => TNext): Pipeline<TIn, TNext> — adds a step and updates TOut',
      'Store the steps as an array of (val: unknown) => unknown — type erasure inside, typed outside',
      'run(input: TIn): TOut executes all steps in sequence',
    ],
    starterCode: `// TODO: implement Pipeline<TIn, TOut>
// pipe<TNext>(fn: (val: TOut) => TNext): Pipeline<TIn, TNext>
// run(input: TIn): TOut

const result = new Pipeline<string>()
  .pipe((s: string) => s.trim())
  .pipe((s: string) => s.toUpperCase())
  .pipe((s: string) => s.split(''))
  .pipe((chars: string[]) => chars.length)
  .run('  hello  ');
// result: number — pipeline is string -> string -> string -> string[] -> number`,
    solution: `class Pipeline<TIn, TOut = TIn> {
  private readonly steps: Array<(val: unknown) => unknown>;

  constructor(steps: Array<(val: unknown) => unknown> = []) {
    this.steps = steps;
  }

  pipe<TNext>(fn: (val: TOut) => TNext): Pipeline<TIn, TNext> {
    return new Pipeline<TIn, TNext>([...this.steps, fn as (val: unknown) => unknown]);
  }

  run(input: TIn): TOut {
    return this.steps.reduce(
      (val, step) => step(val),
      input as unknown
    ) as TOut;
  }
}

const result = new Pipeline<string>()
  .pipe((s: string) => s.trim())
  .pipe((s: string) => s.toUpperCase())
  .pipe((s: string) => s.split(''))
  .pipe((chars: string[]) => chars.length)
  .run('  hello  ');
console.log(result); // 5 — number

// Type checking
const typed: number = result; // OK
// const str: string = result; // Error — result is number`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of `Result<T, E>` over throwing exceptions?',
      options: [
        'It is faster at runtime',
        'Error paths become visible in the function signature — callers must handle them',
        'It works only with async code',
        'It removes the need for try/catch in the implementation',
      ],
      answer: 1,
      explanation: 'Result<T, E> encodes the error path in the return type. Callers see that a function can fail from the type signature and TypeScript enforces they handle both ok: true and ok: false cases.',
    },
    {
      q: 'What does `Awaited<ReturnType<typeof fetchUser>>` give you?',
      options: [
        'The function type of fetchUser',
        'The parameter types of fetchUser',
        'The unwrapped resolved value type of the async function',
        'Promise<ReturnType<fetchUser>>',
      ],
      answer: 2,
      explanation: 'ReturnType<typeof fetchUser> gives Promise<User>. Awaited<Promise<User>> gives User. Together they extract the inner resolved type of an async function.',
    },
    {
      q: 'Why must array branches come before object branches in `DeepReadonly`?',
      options: [
        'Arrays are not objects in JavaScript',
        'Arrays extend object — without the array check first, arrays are incorrectly treated as plain objects',
        'TypeScript processes mapped types in declaration order',
        'ReadonlyArray is only defined for arrays, not objects',
      ],
      answer: 1,
      explanation: 'In JavaScript, typeof [] === "object". Arrays pass the extends object check. If you check extends object first, arrays get mapped as objects instead of ReadonlyArray<T>. Always check the more specific case (array) first.',
    },
    {
      q: 'What does `Parameters<typeof fn>` return?',
      options: [
        'The return type of fn',
        'A tuple of the parameter types of fn',
        'The number of parameters of fn',
        'The parameter names as string literals',
      ],
      answer: 1,
      explanation: 'Parameters<typeof fn> uses infer inside a conditional type to extract the parameter types as a tuple. Parameters<(a: string, b: number) => void> is [a: string, b: number].',
    },
    {
      q: 'How does a generic builder accumulate type information as methods are called?',
      options: [
        'It stores the fields in a runtime Map and TypeScript reads them',
        'Each setter returns a new Builder with an updated generic parameter (e.g. T & Record<K, V>)',
        'It uses declaration merging to extend the builder type',
        'It uses conditional types to check which methods have been called',
      ],
      answer: 1,
      explanation: 'Each setter returns Builder<T & Record<K, V>> — a new type that intersects the previous type with the newly added field. The type parameter grows with each call, accumulating all set fields.',
    },
    {
      q: 'What is a distributive conditional type?',
      options: [
        'A conditional type that distributes computation across CPU cores',
        'A conditional type that applies to each member of a union separately',
        'A conditional type that uses the extends keyword',
        'A conditional type that always returns a union',
      ],
      answer: 1,
      explanation: 'When T in T extends U ? X : Y is a type parameter, TypeScript applies the condition to each member of the union separately. IsString<string | number> becomes IsString<string> | IsString<number> = true | false.',
    },
    {
      q: 'What default does `Repository<T, TCreate = Omit<T, "id">>` provide?',
      options: [
        'TCreate defaults to T — same type for create and the entity',
        'TCreate defaults to Partial<T> — all fields optional on create',
        'TCreate defaults to Omit<T, "id"> — strips the id field for create payloads',
        'TCreate defaults to never — create operations are disabled',
      ],
      answer: 2,
      explanation: 'The id is typically generated by the database. TCreate = Omit<T, "id"> means create() accepts the entity without the id field by default. Callers can still override TCreate if they need a different create shape.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Result<T, E> vs throwing exceptions?',
      a: 'Use Result<T, E> for expected failure cases that are part of the business domain — invalid user input, resource not found, network errors. Use exceptions (throw) for truly unexpected conditions — programming errors, assertion failures, corrupted state. The rule of thumb: if you would document the failure in the function signature, use Result; if it represents a bug, throw.',
    },
    {
      q: 'How do I chain multiple Result operations without deeply nested if checks?',
      a: 'Implement a map() or flatMap() utility on Result. map(fn) applies fn to the value only if ok is true, preserving the error if not. flatMap(fn) applies fn which itself returns a Result — used for operations that can also fail. This is the functional programming "railway oriented programming" pattern.',
    },
    {
      q: 'What is the difference between Omit<T, "id"> and Partial<T>?',
      a: 'Omit<T, "id"> removes the id property entirely — the resulting type has no id field. Partial<T> makes all properties optional — id is still present but optional. For create payloads, Omit is usually correct (the database assigns the id). For update/patch payloads, Partial is usually correct (send only changed fields).',
    },
    {
      q: 'What is the difference between ReturnType and Awaited<ReturnType>?',
      a: 'ReturnType<typeof asyncFn> gives Promise<T> — the raw return type including the Promise wrapper. Awaited<ReturnType<typeof asyncFn>> unwraps the Promise and gives T. Always use Awaited when working with async function return types if you want the resolved value type.',
    },
    {
      q: 'Can I use infer outside of conditional types?',
      a: 'No. infer is only valid inside the extends clause of a conditional type: T extends Promise<infer R> ? R : never. It declares a type variable R that TypeScript infers from the pattern match. infer has no meaning in mapped types, function signatures, or type aliases without an extends conditional.',
    },
    {
      q: 'What is the difference between a generic class and a generic interface in practice?',
      a: 'Generic interfaces define a shape that can be implemented by multiple classes — great for defining contracts (Repository<T>). Generic classes provide both the contract and a default implementation — great for base classes (InMemoryRepository<T>). Interfaces are erased at runtime; classes have a runtime presence (instanceof works).',
    },
    {
      q: 'How does InstanceType differ from just using the class name as a type?',
      a: 'When you have a reference to the class constructor (e.g. as a function argument), you need InstanceType<typeof MyClass> to get the instance type. Using the class name directly (MyClass) works when the class is in scope. InstanceType is needed in generic factory functions: function create<T>(ctor: new() => T): T — here T IS the instance type.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Advanced generic patterns — Result<T,E> for typed errors, Repository<T> for CRUD abstraction, builder type accumulation, and DeepReadonly/ReturnType/Awaited for structural type transformation.',
    mustKnow: [
      'Result<T, E> encodes error paths in the type — callers cannot ignore failures',
      'Awaited<ReturnType<typeof asyncFn>> extracts the resolved value type from async functions',
      'Parameters<typeof fn> and ConstructorParameters<typeof C> extract arg types as tuples',
      'DeepReadonly requires the array check (extends (infer U)[]) BEFORE the object check',
      'Generic builders accumulate type via T & Record<K, V> — each setter returns a wider type',
      'TCreate = Omit<T, "id"> is the standard pattern for create payloads in a generic repository',
      'Distributive conditionals apply to each union member — wrap in [T] extends [U] to disable',
    ],
    interviewFocus: [
      'What is the Result<T, E> pattern and when should you use it over throw?',
      'How do you extract the resolved type of an async function without declaring it explicitly?',
      'What is a distributive conditional type and how do you opt out of distribution?',
      'How does a generic builder accumulate type information as methods are called?',
      'Why must array checks come before object checks in recursive mapped types?',
    ],
  };
}
