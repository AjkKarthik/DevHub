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
  selector: 'app-ts-utility-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './utility-types.html',
  styleUrl: './utility-types.scss',
})
export class TsUtilityTypes {
  quickRef: QuickRefItem[] = [
    { name: 'Partial<T>',             type: 'type', desc: 'All properties of T become optional' },
    { name: 'Required<T>',            type: 'type', desc: 'All properties of T become required (removes ?)' },
    { name: 'Readonly<T>',            type: 'type', desc: 'All properties of T become readonly' },
    { name: 'Pick<T, K>',             type: 'type', desc: 'Keep only keys K from T' },
    { name: 'Omit<T, K>',             type: 'type', desc: 'Remove keys K from T' },
    { name: 'Record<K, V>',           type: 'type', desc: 'Object type with keys K and values V' },
    { name: 'Extract<T, U>',          type: 'type', desc: 'Keep union members of T that are assignable to U' },
    { name: 'Exclude<T, U>',          type: 'type', desc: 'Remove union members of T that are assignable to U' },
    { name: 'NonNullable<T>',         type: 'type', desc: 'Remove null and undefined from T' },
    { name: 'ReturnType<T>',          type: 'type', desc: 'Extract the return type of function type T' },
    { name: 'Parameters<T>',          type: 'type', desc: 'Extract parameter types of function type T as a tuple' },
    { name: 'Awaited<T>',             type: 'type', desc: 'Recursively unwrap Promise<T> to T' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Object property modifiers — Partial, Required, Readonly, Pick, Omit',
      points: [
        '<code>Partial&lt;T&gt;</code> makes all properties optional. Implemented as <code>{ [K in keyof T]?: T[K] }</code>. Classic use: update/patch DTOs where you send only changed fields. Shallow — nested objects are NOT made partial.',
        '<code>Required&lt;T&gt;</code> removes all optional modifiers: <code>{ [K in keyof T]-?: T[K] }</code>. The <code>-?</code> removes the optional modifier. Use when you have a partial config object and need to ensure all fields are present after merging with defaults.',
        '<code>Readonly&lt;T&gt;</code> adds readonly to every property: <code>{ readonly [K in keyof T]: T[K] }</code>. Prevents accidental mutation — useful for config objects, frozen state, and function return values you don\'t want callers to modify.',
        '<code>Pick&lt;T, K extends keyof T&gt;</code> constructs a type with only the selected keys. <code>Omit&lt;T, K&gt;</code> does the opposite — removes the specified keys. Pick is the inclusion list; Omit is the exclusion list. Use Omit for create DTOs (Omit<User, "id">) and Pick for view models.',
      ],
    },
    {
      heading: 'Record<K, V> — typed dictionaries',
      points: [
        '<code>Record&lt;K, V&gt;</code> builds a type whose keys are K and values are V: <code>type Scores = Record&lt;string, number&gt;</code>. More expressive than <code>{ [key: string]: number }</code> — the key type can be a union: <code>Record&lt;"admin" | "user" | "guest", Permission&gt;</code>.',
        'When K is a union of string literals, TypeScript requires all keys to be present: <code>Record&lt;"a" | "b", number&gt;</code> → you must provide both "a" and "b". This acts like a completeness check — missing a key is a compile error.',
        'Common patterns: lookup tables (<code>Record&lt;StatusCode, string&gt;</code>), caches (<code>Record&lt;string, CacheEntry&gt;</code>), and flag maps (<code>Record&lt;FeatureFlag, boolean&gt;</code>).',
        '<code>Record&lt;string, unknown&gt;</code> is the safe alternative to <code>object</code> or <code>{}</code> when you need a generic dictionary. <code>unknown</code> forces the caller to narrow before using the value, unlike <code>any</code>.',
      ],
    },
    {
      heading: 'Union manipulation — Extract, Exclude, NonNullable',
      points: [
        '<code>Extract&lt;T, U&gt;</code> keeps the members of T that are assignable to U: <code>Extract&lt;"a" | "b" | 1 | 2, string&gt;</code> → <code>"a" | "b"</code>. Used to narrow a union to a specific subset.',
        '<code>Exclude&lt;T, U&gt;</code> removes the members of T that are assignable to U: <code>Exclude&lt;"a" | "b" | 1 | 2, string&gt;</code> → <code>1 | 2</code>. The inverse of Extract. Use to strip known members from a union.',
        '<code>NonNullable&lt;T&gt;</code> is <code>Exclude&lt;T, null | undefined&gt;</code>. Removes both null and undefined: <code>NonNullable&lt;string | null | undefined&gt;</code> → <code>string</code>.',
        'Both Extract and Exclude are distributive — they apply to each union member independently. <code>Exclude&lt;T, never&gt;</code> is T (nothing removed); <code>Extract&lt;T, never&gt;</code> is never (nothing kept).',
      ],
    },
    {
      heading: 'Function introspection — ReturnType, Parameters, ConstructorParameters',
      points: [
        '<code>ReturnType&lt;typeof fn&gt;</code> extracts the return type without re-declaring it. For async functions, use <code>Awaited&lt;ReturnType&lt;typeof fn&gt;&gt;</code> to unwrap the Promise.',
        '<code>Parameters&lt;typeof fn&gt;</code> gives a tuple of the parameter types: used to wrap or forward function calls without repeating the signature.',
        '<code>ConstructorParameters&lt;typeof MyClass&gt;</code> does the same for class constructors. <code>InstanceType&lt;typeof MyClass&gt;</code> gives the instance type — equivalent to just writing <code>MyClass</code> when the class is in scope, but essential in generic contexts.',
        'These utilities are implemented with <code>infer</code> under the hood: <code>type ReturnType&lt;T&gt; = T extends (...args: any) =&gt; infer R ? R : never</code>. Understanding this helps you write your own extraction utilities.',
      ],
    },
    {
      heading: 'Combining utility types — composing transformations',
      points: [
        'Utility types compose: <code>Partial&lt;Pick&lt;User, "name" | "email"&gt;&gt;</code> gives a type with optional name and optional email. <code>Required&lt;Omit&lt;Config, "optional"&gt;&gt;</code> gives all properties except "optional", all required.',
        '<code>Readonly&lt;Record&lt;string, number&gt;&gt;</code> gives an immutable dictionary. <code>Partial&lt;Record&lt;K, V&gt;&gt;</code> gives a dictionary where all keys are optional — useful for feature flags.',
        'Type aliases help with readability: <code>type UpdateDTO&lt;T&gt; = Partial&lt;Omit&lt;T, "id" | "createdAt"&gt;&gt;</code>. Define once, reuse across all entity update types.',
        'Watch out for deep vs shallow: <code>Partial&lt;Config&gt;</code> only makes the top-level properties optional. Nested <code>Config.db</code> is still a required object internally — use DeepPartial for recursive optionality.',
      ],
    },
    {
      heading: 'String utility types — Uppercase, Lowercase, Capitalize, Uncapitalize',
      points: [
        'TypeScript has four built-in string manipulation types that operate at the type level: <code>Uppercase&lt;"hello"&gt;</code> → <code>"HELLO"</code>, <code>Lowercase&lt;"HELLO"&gt;</code> → <code>"hello"</code>, <code>Capitalize&lt;"hello"&gt;</code> → <code>"Hello"</code>, <code>Uncapitalize&lt;"Hello"&gt;</code> → <code>"hello"</code>.',
        'These are intrinsic — implemented in the TypeScript compiler itself, not with regular TypeScript types. They work on string literal types and distribute over unions.',
        'Useful with template literal types: <code>type GetterName&lt;T extends string&gt; = \`get\${Capitalize&lt;T&gt;}\`</code>. <code>GetterName&lt;"name"&gt;</code> → <code>"getName"</code>.',
        'Combined with keyof and mapped types, these enable automatic getter/setter type generation, event name transformation, and CSS class name conventions at the type level.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Partial, Required, Readonly',
      language: 'typescript',
      code: `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  bio?: string;
}

// Partial — all optional (patch/update DTOs)
type UserPatch = Partial<User>;
const patch: UserPatch = { name: 'Alice' }; // only name — rest optional

// Required — remove all ? modifiers
type CompleteUser = Required<User>;
// bio is now required — must be provided

// Readonly — freeze all properties
type FrozenUser = Readonly<User>;
const frozen: FrozenUser = { id: '1', name: 'Alice', email: 'a@b.com', role: 'user' };
// frozen.name = 'Bob'; // Error — readonly

// Shallow — Partial does NOT recurse into nested types
interface Config { db: { host: string; port: number }; timeout: number }
type PartialConfig = Partial<Config>;
// PartialConfig = { db?: { host: string; port: number }; timeout?: number }
// db is optional, but if provided, BOTH host AND port are required inside it

// With defaults pattern — Required after merge
const defaults: Required<Config> = { db: { host: 'localhost', port: 5432 }, timeout: 5000 };
function applyConfig(cfg: Partial<Config>): Required<Config> {
  return { ...defaults, ...cfg, db: { ...defaults.db, ...(cfg.db ?? {}) } };
}`,
    },
    {
      label: 'Pick, Omit, Record',
      language: 'typescript',
      code: `interface User {
  id: string; name: string; email: string;
  passwordHash: string; createdAt: Date; role: 'admin' | 'user';
}

// Pick — inclusion list (keep only what you need)
type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;
// { id: string; name: string; email: string; role: 'admin' | 'user' }

// Omit — exclusion list (remove sensitive/internal fields)
type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'passwordHash'>;
// { name: string; email: string; role: 'admin' | 'user' }

// Record — typed dictionary
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;
const perms: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user:  ['read', 'write'],
  guest: ['read'],
  // missing 'guest' would be a compile error — Record enforces all keys
};

// Record<string, unknown> — safe generic dictionary
function parseHeaders(raw: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([, v]) => typeof v === 'string')
      .map(([k, v]) => [k, v as string])
  );
}

// Combining Pick + Omit
type UpdateUserDTO = Partial<Omit<User, 'id' | 'createdAt' | 'passwordHash'>>;
// All fields optional except id, createdAt, and passwordHash (removed entirely)`,
    },
    {
      label: 'Extract, Exclude, NonNullable',
      language: 'typescript',
      code: `type AllEvents = 'click' | 'hover' | 'focus' | 'blur' | 'keydown' | 'keyup';
type MouseEvents = Extract<AllEvents, 'click' | 'hover' | 'focus'>; // 'click' | 'hover' | 'focus'
type KeyboardEvents = Extract<AllEvents, \`key\${string}\`>;           // 'keydown' | 'keyup'
type NonMouseEvents = Exclude<AllEvents, 'click' | 'hover'>;        // 'focus' | 'blur' | 'keydown' | 'keyup'

// Extract with class hierarchy
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}
type Animals = Dog | Cat | string | number;
type OnlyAnimals = Extract<Animals, Animal>; // Dog | Cat

// NonNullable — remove null and undefined
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

// Practical: filter an object type to only nullable properties
type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];
interface Profile { name: string; bio: string | null; avatar: string | null }
type NullableProfileKeys = NullableKeys<Profile>; // 'bio' | 'avatar'

// Exclude null/undefined from function param after guard
function process(val: string | null | undefined): void {
  type NonNull = NonNullable<typeof val>; // string — use in type-level logic
  if (val == null) return;
  val; // string — narrowed by control flow
}`,
    },
    {
      label: 'ReturnType, Parameters, Awaited',
      language: 'typescript',
      code: `// ReturnType — extract without redeclaring
function createUser(name: string, role: 'admin' | 'user') {
  return { id: crypto.randomUUID(), name, role, createdAt: new Date() };
}
type CreatedUser = ReturnType<typeof createUser>;
// { id: string; name: string; role: 'admin' | 'user'; createdAt: Date }

// Awaited + ReturnType — async functions
async function fetchUser(id: string) {
  return { id, name: 'Alice', email: 'a@b.com' };
}
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
// { id: string; name: string; email: string }

// Parameters — wrap functions without repeating types
function sendNotification(userId: string, title: string, body: string, urgent: boolean): void { /* */ }
type NotifArgs = Parameters<typeof sendNotification>;
// [userId: string, title: string, body: string, urgent: boolean]

function scheduleNotification(delay: number, ...args: NotifArgs): void {
  setTimeout(() => sendNotification(...args), delay);
}

// ConstructorParameters — factory generic
class HttpClient {
  constructor(public baseUrl: string, public timeout: number, public headers: Record<string, string>) {}
}
type ClientArgs = ConstructorParameters<typeof HttpClient>; // [string, number, Record<string, string>]

function createClient(...args: ClientArgs): HttpClient {
  return new HttpClient(...args);
}

// InstanceType — when you have the class reference dynamically
function clone<T>(ctor: new (...args: unknown[]) => T, instance: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(instance)), instance);
}`,
    },
    {
      label: 'String Utility Types',
      language: 'typescript',
      code: `// Built-in string manipulation types
type A = Uppercase<'hello'>;     // 'HELLO'
type B = Lowercase<'WORLD'>;     // 'world'
type C = Capitalize<'user'>;     // 'User'
type D = Uncapitalize<'Button'>; // 'button'

// With union — distributes over members
type EventNames = 'click' | 'hover' | 'focus';
type UpperEvents = Uppercase<EventNames>; // 'CLICK' | 'HOVER' | 'FOCUS'

// Practical: auto-generate getter types from property names
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
interface User { name: string; age: number }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }

// CSS class name convention
type CssClass<T extends string> = \`ts-\${Lowercase<T>}\`;
type ComponentClass = CssClass<'Button' | 'Modal'>; // 'ts-button' | 'ts-modal'

// Combining with Record for event handler maps
type HandlerMap<Events extends string> = Partial<
  Record<\`on\${Capitalize<Events>}\`, (event: Event) => void>
>;
type DOMHandlers = HandlerMap<'click' | 'focus' | 'blur'>;
// { onClick?: ...; onFocus?: ...; onBlur?: ... }
const handlers: DOMHandlers = {
  onClick: (e) => console.log('clicked', e),
};`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Partial is shallow — nested properties are still required',
      wrong: `interface Config { db: { host: string; port: number }; timeout: number }
const partial: Partial<Config> = { db: { host: 'localhost' } };
// Error: Property 'port' is missing — db is a full required object inside!`,
      right: `// Option 1: DeepPartial (custom)
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
const deep: DeepPartial<Config> = { db: { host: 'localhost' } }; // OK

// Option 2: explicit nested Partial
type PartialConfig = { db?: Partial<Config['db']>; timeout?: number };`,
      explanation: 'Partial<T> only removes ? from top-level properties. Nested object types remain unchanged. If you need deep optionality, write a DeepPartial recursive type or apply Partial explicitly at each level.',
    },
    {
      title: 'Using Omit with a union type — unexpected behavior',
      wrong: `type A = { type: 'a'; value: string };
type B = { type: 'b'; count: number };
type AB = A | B;
type OmitType = Omit<AB, 'type'>; // NOT { value: string } | { count: number }
// Result: {} — only common keys survive Omit on a union!`,
      right: `// Apply Omit to each union member separately using distributive mapped type
type DistributiveOmit<T, K extends string | number | symbol> =
  T extends unknown ? Omit<T, K> : never;

type OmitType = DistributiveOmit<AB, 'type'>;
// { value: string } | { count: number } — correct!`,
      explanation: 'Omit<Union, K> picks only the keys common to ALL union members, then omits K from those. To omit from each member independently, use a distributive mapped type.',
    },
    {
      title: 'Record<string, T> — TypeScript assumes every key exists',
      wrong: `const map: Record<string, User> = {};
const user = map['nonexistent'];
user.name; // No error — TypeScript thinks user is User, not User | undefined!`,
      right: `// Option 1: noUncheckedIndexedAccess tsconfig flag
// With it: map['nonexistent'] is User | undefined

// Option 2: Map<string, User> — get() returns User | undefined
const map = new Map<string, User>();
const user = map.get('nonexistent'); // User | undefined — safe

// Option 3: Explicit undefined
const map2: Record<string, User | undefined> = {};
const user2 = map2['key']; // User | undefined`,
      explanation: 'Record<string, T> and index signatures tell TypeScript any string key returns T — but at runtime the key may not exist. Enable noUncheckedIndexedAccess in tsconfig, or use Map<K, V>, or explicitly add | undefined to the value type.',
    },
    {
      title: 'Using Exclude instead of Omit — different purposes',
      wrong: `interface User { id: string; name: string; email: string }
// Trying to remove the 'id' property using Exclude
type NoId = Exclude<User, 'id'>; // This is WRONG — Exclude works on union members, not object keys
// Result: User (unchanged — User is not assignable to 'id')`,
      right: `// Omit removes a property key from an object type
type NoId = Omit<User, 'id'>;
// { name: string; email: string }

// Exclude removes members from a union type
type Strings = Exclude<string | number | boolean, number | boolean>;
// string`,
      explanation: 'Omit removes object property keys; Exclude removes union type members. They are different operations. Omit<T, K> and Exclude<T, U> look similar but operate on entirely different things.',
    },
    {
      title: 'Forgetting Awaited when using ReturnType on async functions',
      wrong: `async function getSettings(): Promise<Settings> { /* ... */ return {} as Settings; }
type SettingsType = ReturnType<typeof getSettings>; // Promise<Settings> — NOT Settings!
const s: SettingsType = {} as Settings; // Error — Settings is not assignable to Promise<Settings>`,
      right: `type SettingsType = Awaited<ReturnType<typeof getSettings>>; // Settings`,
      explanation: 'ReturnType of an async function is Promise<T>. Always wrap with Awaited<...> to get the resolved value type when you want the inner type, not the Promise wrapper.',
    },
    {
      title: 'Using Required<T> when you only need some fields required',
      wrong: `interface FormState {
  name?: string; email?: string; phone?: string; address?: string;
}
// Requiring ALL fields on submit — but phone and address are genuinely optional
type SubmitState = Required<FormState>;
// { name: string; email: string; phone: string; address: string } — phone/address forced!`,
      right: `// Pick + Required for the fields that must be present
type SubmitState = Required<Pick<FormState, 'name' | 'email'>> & Pick<FormState, 'phone' | 'address'>;
// { name: string; email: string; phone?: string; address?: string }`,
      explanation: 'Required<T> makes ALL properties required. When only some fields need to be required, combine Required<Pick<T, "fields">> with Pick<T, "other-fields"> for the optional remainder.',
    },
  ];

  challenge: Challenge = {
    title: 'Build UpdateDTO and ViewDTO utility types',
    language: 'typescript',
    description: 'Create two reusable generic utility types: (1) UpdateDTO<T> that takes an entity type and produces a patch type — all fields optional, internal fields removed (id, createdAt, updatedAt). (2) ViewDTO<T, K extends keyof T> that creates a read-only view of selected fields. Then apply them to a Post entity and verify the types are correct.',
    hints: [
      'UpdateDTO<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>',
      'ViewDTO<T, K extends keyof T> = Readonly<Pick<T, K>>',
      'Test: UpdateDTO<Post> should NOT have id, createdAt, updatedAt; all remaining fields should be optional',
      'Test: ViewDTO<Post, "id" | "title"> should be readonly and have only id and title',
    ],
    starterCode: `interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// TODO 1: Define UpdateDTO<T> — Partial, no id/createdAt/updatedAt
// TODO 2: Define ViewDTO<T, K extends keyof T> — Readonly Pick

// Test it:
type PostUpdate = UpdateDTO<Post>;
type PostCard  = ViewDTO<Post, 'id' | 'title' | 'published'>;

declare const patch: PostUpdate;
// patch.id; // should error — id not in UpdateDTO
// patch.title = undefined; // should be OK — title is optional

declare const card: PostCard;
// card.title = 'new'; // should error — PostCard is readonly`,
    solution: `interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type UpdateDTO<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
type ViewDTO<T, K extends keyof T> = Readonly<Pick<T, K>>;

// Verify
type PostUpdate = UpdateDTO<Post>;
// { title?: string; content?: string; authorId?: string; published?: boolean; tags?: string[] }

type PostCard = ViewDTO<Post, 'id' | 'title' | 'published'>;
// { readonly id: string; readonly title: string; readonly published: boolean }

// Usage
function updatePost(id: string, patch: UpdateDTO<Post>): Promise<Post> {
  return Promise.resolve({} as Post);
}
updatePost('1', { title: 'New Title', published: true }); // OK
// updatePost('1', { id: 'x' }); // Error — id not in UpdateDTO

function renderCard(post: ViewDTO<Post, 'id' | 'title' | 'published'>): string {
  // post.title = 'x'; // Error — readonly
  return \`[\${post.published ? 'LIVE' : 'DRAFT'}] \${post.title}\`;
}

// Composing further
type AdminView = ViewDTO<Post, keyof Post>; // Readonly<Post> — all fields, readonly
type Summary   = ViewDTO<Post, 'id' | 'title'>; // minimal read-only card`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `Partial<T>` do to nested object properties?',
      options: [
        'It makes nested properties optional recursively',
        'It only makes top-level properties optional — nested objects remain unchanged',
        'It removes nested objects entirely',
        'It converts nested objects to Partial as well',
      ],
      answer: 1,
      explanation: 'Partial<T> is shallow — it adds ? only to the top-level keys. Nested object types (like db: { host: string }) remain as fully required objects. Use DeepPartial for recursive optionality.',
    },
    {
      q: 'What is the difference between `Omit` and `Exclude`?',
      options: [
        'They are identical — both remove from unions',
        'Omit removes object property keys; Exclude removes union type members',
        'Omit works on unions; Exclude works on objects',
        'Exclude is the inverse of Omit',
      ],
      answer: 1,
      explanation: 'Omit<T, K> removes keys K from object type T — produces a new object type. Exclude<T, U> removes union members of T that are assignable to U — produces a new union type. They operate on fundamentally different things.',
    },
    {
      q: 'What does `Record<"a" | "b", number>` require?',
      options: [
        'An object with at least "a" and "b" keys',
        'An object with exactly "a" and "b" keys — both are required',
        'An object where "a" or "b" may be present',
        'An object with string keys mapped to number',
      ],
      answer: 1,
      explanation: 'When K is a string literal union, Record<K, V> requires ALL keys to be present. Missing "a" or "b" is a compile error. This is a useful completeness check — add a new union member and all Record uses must be updated.',
    },
    {
      q: 'What does `Extract<"click" | "hover" | 1 | 2, string>` return?',
      options: [
        '"click" | "hover" | 1 | 2',
        '"click" | "hover"',
        '1 | 2',
        'string',
      ],
      answer: 1,
      explanation: 'Extract keeps union members that are assignable to the second argument. "click" and "hover" are strings — they are kept. 1 and 2 are numbers — they are removed.',
    },
    {
      q: 'What is `NonNullable<string | null | undefined>`?',
      options: [
        'string | null',
        'string | undefined',
        'string',
        'never',
      ],
      answer: 2,
      explanation: 'NonNullable<T> is Exclude<T, null | undefined>. It removes both null and undefined from the union, leaving only string.',
    },
    {
      q: 'What does `Uppercase<"hello" | "world">` produce?',
      options: [
        '"HELLO | WORLD"',
        '"HELLO" | "WORLD"',
        '"HELLOWORLD"',
        'string',
      ],
      answer: 1,
      explanation: 'String utility types distribute over union members. Uppercase<"hello" | "world"> applies Uppercase to each member independently, giving "HELLO" | "WORLD".',
    },
    {
      q: 'What is the problem with `Record<string, User>` when accessing a missing key?',
      options: [
        'TypeScript throws a runtime error',
        'TypeScript returns undefined but types it as User — unsafe unless noUncheckedIndexedAccess is enabled',
        'TypeScript correctly types the result as User | undefined',
        'There is no problem — TypeScript handles this correctly by default',
      ],
      answer: 1,
      explanation: 'By default, TypeScript assumes every key in a Record<string, T> exists and types access as T, not T | undefined. At runtime, missing keys return undefined. Enable noUncheckedIndexedAccess to get T | undefined automatically.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Pick vs Omit?',
      a: 'Use Pick when you have a small set of fields you WANT to keep — the inclusion list is short. Use Omit when you have a small set of fields you WANT to REMOVE — the exclusion list is short. If adding a new field to the base type should automatically appear in the derived type, use Omit. If the derived type should remain a fixed subset, use Pick.',
    },
    {
      q: 'What is the difference between Partial<T> and making all properties optional manually?',
      a: 'They produce the same type. Partial<T> is the idiomatic way — concise, self-documenting, and updates automatically when T gains new properties. Manual optional annotations { name?: string; email?: string } would need to be updated every time the base type changes.',
    },
    {
      q: 'Why does `Omit<Union, K>` not distribute over union members?',
      a: 'Omit is implemented as Pick<T, Exclude<keyof T, K>>. keyof applied to a union gives only the COMMON keys. So Omit picks from the common keys, discarding union-specific ones. To distribute Omit over union members, use a distributive mapped type: type DistributiveOmit<T, K> = T extends unknown ? Omit<T, K> : never.',
    },
    {
      q: 'How do I make a type that accepts only certain string patterns?',
      a: 'Use template literal types combined with Extract. For example, to accept only keys that start with "on": type EventKeys<T extends string> = Extract<T, `on${string}`>. Combine with Record for typed event handler objects: Record<EventKeys<AllEvents>, Handler>.',
    },
    {
      q: 'What is the difference between `Required<T>` and removing optional modifiers manually?',
      a: 'Required<T> uses the -? modifier in a mapped type: { [K in keyof T]-?: T[K] }. It removes ? from all properties. Manually removing ? is identical in effect but does not scale — Required<T> updates automatically when the base type changes.',
    },
    {
      q: 'Can utility types be nested and composed?',
      a: 'Yes — utility types are just type aliases. You can compose them: Partial<Omit<T, "id">> or Readonly<Record<K, V>>. TypeScript evaluates them inside-out. Define a named alias for complex compositions: type UpdateDTO<T> = Partial<Omit<T, "id" | "createdAt">> to keep usage sites readable.',
    },
    {
      q: 'What is `noUncheckedIndexedAccess` and why does it matter for `Record<string, T>`?',
      a: 'noUncheckedIndexedAccess is a tsconfig flag that adds | undefined to all index signature accesses. With it enabled, Record<string, User>["key"] is User | undefined instead of User. This catches a common runtime bug where you access a missing key and get undefined but TypeScript says it is T. It is not part of strict mode — must be enabled separately.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TypeScript\'s built-in utility types transform existing types — Partial/Required/Readonly modify modifiers, Pick/Omit select/remove keys, Record builds dictionaries, Extract/Exclude filter unions, and ReturnType/Parameters/Awaited extract function types.',
    mustKnow: [
      'Partial<T> is shallow — nested objects remain fully required inside',
      'Omit removes object property keys; Exclude removes union members — not interchangeable',
      'Record<K, V> with a literal union K requires ALL keys to be present — a completeness check',
      'Record<string, T> types missing key access as T, not T | undefined — use noUncheckedIndexedAccess',
      'Awaited<ReturnType<typeof asyncFn>> is needed to get the resolved type of an async function',
      'String utility types (Uppercase/Capitalize) distribute over union members',
      'Omit on a union only keeps common keys — use DistributiveOmit for per-member omission',
    ],
    interviewFocus: [
      'What is the difference between Omit and Exclude?',
      'Why is Partial<T> shallow and how do you make it recursive?',
      'What does Record<"a" | "b", T> enforce at compile time?',
      'How do you extract the resolved value type of an async function?',
      'What is noUncheckedIndexedAccess and when would you enable it?',
    ],
  };
}
