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
  selector: 'app-ts-mapped-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './mapped-types.html',
  styleUrl: './mapped-types.scss',
})
export class TsMappedTypes {
  quickRef: QuickRefItem[] = [
    { name: '{ [K in keyof T]: T[K] }',    type: 'syntax',   desc: 'Identity mapped type — iterate over all keys, preserving types' },
    { name: '{ [K in keyof T]?: T[K] }',   type: 'syntax',   desc: 'Add optional modifier to every property (Partial<T> implementation)' },
    { name: '{ [K in keyof T]-?: T[K] }',  type: 'syntax',   desc: '-? removes the optional modifier (Required<T> implementation)' },
    { name: '{ readonly [K in keyof T]: T[K] }', type: 'syntax', desc: 'Add readonly modifier to every property (Readonly<T>)' },
    { name: '-readonly',                    type: 'syntax',   desc: 'Remove the readonly modifier from all properties' },
    { name: 'as NewKey',                    type: 'syntax',   desc: 'Key remapping — rename or filter keys in a mapped type (TS 4.1+)' },
    { name: 'as never',                     type: 'syntax',   desc: 'Filter out a key — never keys are excluded from the resulting type' },
    { name: '[K in K2]',                    type: 'syntax',   desc: 'Iterate over a custom union — does not have to be keyof T' },
    { name: 'T[K]',                         type: 'syntax',   desc: 'Indexed access type — the type of property K in T' },
    { name: 'K extends keyof T',            type: 'constraint', desc: 'Constrain K to the known keys of T — safe indexed access' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Mapped types — transform every property of a type',
      points: [
        'A mapped type iterates over the keys of a type and produces a new type by transforming each property: <code>{ [K in keyof T]: T[K] }</code> is the identity mapped type — it produces a type identical to T.',
        'The general form is <code>[K in UnionOfKeys]: ValueType</code>. K takes on each value in the union one at a time. The value type can reference both K and the input type T using indexed access: <code>T[K]</code>.',
        'All built-in utility types are mapped types: <code>Partial&lt;T&gt; = { [K in keyof T]?: T[K] }</code>, <code>Readonly&lt;T&gt; = { readonly [K in keyof T]: T[K] }</code>, <code>Record&lt;K, V&gt; = { [P in K]: V }</code>.',
        'Mapped types can iterate over any union, not just <code>keyof T</code>: <code>{ [K in "a" | "b" | "c"]: number }</code> creates <code>{ a: number; b: number; c: number }</code>.',
      ],
    },
    {
      heading: 'Modifiers — adding and removing optional and readonly',
      points: [
        'You can add modifiers inside a mapped type: <code>?</code> makes a property optional, <code>readonly</code> makes it immutable. These correspond directly to what you would write in an interface.',
        'The <code>-</code> prefix removes a modifier: <code>-?</code> removes optional (making the property required), <code>-readonly</code> removes the readonly constraint. This is how <code>Required&lt;T&gt;</code> and the mutable equivalent of Readonly work.',
        'The <code>+</code> prefix is explicit addition (same as no prefix): <code>+?</code> is the same as <code>?</code>, <code>+readonly</code> is the same as <code>readonly</code>. You rarely need the explicit <code>+</code>.',
        'Modifiers in mapped types allow you to create transformations that are impossible with intersection types or interfaces — you can systematically add or remove <code>?</code> and <code>readonly</code> across the entire type at once.',
      ],
    },
    {
      heading: 'Key remapping with `as` — rename and filter keys (TS 4.1+)',
      points: [
        'TypeScript 4.1 added key remapping: <code>[K in keyof T as NewKey]: T[K]</code>. The <code>as NewKey</code> clause transforms the key — typically using template literal types to rename it.',
        'Filter keys by mapping to <code>never</code>: <code>[K in keyof T as T[K] extends string ? K : never]: T[K]</code> — only keeps properties whose values are strings. Mapping a key to never excludes it from the result.',
        'Generate getter names: <code>[K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K]</code> — transforms every property into a getter method with a capitalized "get" prefix.',
        'The <code>string &amp; K</code> is needed because K is <code>string | number | symbol</code> and Capitalize requires a string. The intersection narrows K to its string members.',
      ],
    },
    {
      heading: 'Indexed access types — T[K]',
      points: [
        '<code>T[K]</code> retrieves the type of property K in T: <code>User["name"]</code> is <code>string</code>. This is the type-level equivalent of <code>obj.name</code>. K must be a valid key of T.',
        'Use a union as the index to get a union of value types: <code>User["name" | "email"]</code> is <code>string</code>. <code>User[keyof User]</code> is the union of ALL value types in User.',
        'Works with arrays: <code>string[][number]</code> is <code>string</code> — the element type of a string array. <code>SomeArray[number]</code> is the standard pattern to extract array element types.',
        'Indexed access is safe only when K is known to be a key of T. Use <code>K extends keyof T</code> as a constraint when working with generic K to prevent "index type K cannot be used to index type T" errors.',
      ],
    },
    {
      heading: 'Combining mapped types with conditional types',
      points: [
        'The most powerful patterns combine mapped types (to iterate keys) with conditional types (to transform values): <code>{ [K in keyof T]: T[K] extends string ? "text" : "other" }</code>.',
        'Filtering keys: use <code>as T[K] extends SomeType ? K : never</code> to keep only keys whose values match a condition. This is how the FunctionKeys pattern from the previous page works.',
        'Deep transformation: recursive mapped types apply conditional logic at every level of nesting — DeepReadonly, DeepPartial, and similar utilities use this combination.',
        'Important limitation: mapped types cannot iterate over tuple elements differently from array elements. For tuple transformation, you need variadic tuple types or per-position type assertions.',
      ],
    },
    {
      heading: 'Homomorphic vs non-homomorphic mapped types',
      points: [
        'A <em>homomorphic</em> mapped type is one that iterates over <code>keyof T</code> — it preserves the structure of T and carries over modifiers (optional, readonly) from the original type.',
        'A <em>non-homomorphic</em> mapped type iterates over a custom union (not <code>keyof T</code>) — it does NOT carry over modifiers and creates a fresh type. <code>Record&lt;K, V&gt;</code> is non-homomorphic.',
        'This distinction matters when you want to preserve optionality: <code>Partial&lt;T&gt;</code> is homomorphic so it respects the original readonly modifiers. <code>Record&lt;keyof T, V&gt;</code> does NOT — it loses the readonly modifiers from T.',
        'When writing your own mapped types, use <code>keyof T</code> (homomorphic) when you want to transform an existing type. Use a literal union (non-homomorphic) when you are building a new type from scratch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Mapped Types',
      language: 'typescript',
      code: `// Identity mapped type — same as T
type Identity<T> = { [K in keyof T]: T[K] };

// Custom transformations
interface User { id: string; name: string; email: string; age: number }

// Make all values nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<User>;
// { id: string | null; name: string | null; ... }

// Wrap all values in an array
type Listify<T> = { [K in keyof T]: T[K][] };
type UserLists = Listify<User>;
// { id: string[]; name: string[]; email: string[]; age: number[] }

// Convert all values to a fixed type
type Flags<T> = { [K in keyof T]: boolean };
type UserFlags = Flags<User>;
// { id: boolean; name: boolean; email: boolean; age: boolean }

// Iterate over a custom union (non-homomorphic)
type RGB = { [K in 'red' | 'green' | 'blue']: number };
// { red: number; green: number; blue: number }
// Same as Record<'red' | 'green' | 'blue', number>`,
    },
    {
      label: 'Modifiers (+/- optional, readonly)',
      language: 'typescript',
      code: `// Implementation of Partial (add ?)
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Implementation of Required (remove ?)
type MyRequired<T> = { [K in keyof T]-?: T[K] };

// Implementation of Readonly (add readonly)
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// Remove readonly (make mutable)
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface FrozenConfig { readonly host: string; readonly port: number }
type MutableConfig = Mutable<FrozenConfig>;
// { host: string; port: number } — readonly removed

// Optional readonly
type PartialReadonly<T> = { readonly [K in keyof T]?: T[K] };
// Both readonly AND optional — add both modifiers

// Remove both optional and readonly
type StrictMutable<T> = { -readonly [K in keyof T]-?: T[K] };
// All properties: required + mutable`,
    },
    {
      label: 'Key Remapping (as)',
      language: 'typescript',
      code: `// Key remapping — rename keys with template literals
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
interface User { name: string; age: number; role: string }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number; getRole: () => string }

// Setters
type Setters<T> = {
  [K in keyof T as \`set\${Capitalize<string & K>}\`]: (val: T[K]) => void;
};

// Filter by value type — keep only string properties
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
interface Mixed { id: string; name: string; age: number; active: boolean }
type StringProps = StringKeys<Mixed>;
// { id: string; name: string } — age and active excluded

// Filter by key name — keep only keys starting with "on"
type EventHandlers<T> = {
  [K in keyof T as K extends \`on\${string}\` ? K : never]: T[K];
};
interface Component {
  id: string;
  onClick: () => void;
  onHover: () => void;
  render: () => string;
}
type Handlers = EventHandlers<Component>;
// { onClick: () => void; onHover: () => void }`,
    },
    {
      label: 'Indexed Access Types',
      language: 'typescript',
      code: `interface User {
  id: string;
  profile: { name: string; avatar: string; bio: string | null };
  settings: { theme: 'light' | 'dark'; notifications: boolean };
}

// Direct property access
type UserId = User['id'];          // string
type Profile = User['profile'];    // { name: string; avatar: string; bio: string | null }

// Nested access
type Bio = User['profile']['bio']; // string | null
type Theme = User['settings']['theme']; // 'light' | 'dark'

// Union index — get union of value types
type ProfileValues = User['profile'][keyof User['profile']];
// string | string | string | null → string | null

// All value types of User
type AnyUserValue = User[keyof User]; // string | Profile | Settings

// Array element type — standard pattern
type EventList = Array<{ type: string; payload: unknown }>;
type SingleEvent = EventList[number]; // { type: string; payload: unknown }

// Tuple element types
type Coords = [number, number, number];
type X = Coords[0]; // number
type AnyCoord = Coords[number]; // number (union of all element types)

// Generic indexed access
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key]);
}
declare const users: User[];
const ids = pluck(users, 'id'); // string[]`,
    },
    {
      label: 'Mapped + Conditional Combined',
      language: 'typescript',
      code: `// Filter by value type using conditional + as never
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
interface Entity {
  id: string; name: string; age: number;
  active: boolean; score: number;
}
type StringFields  = PickByValue<Entity, string>;  // { id: string; name: string }
type NumberFields  = PickByValue<Entity, number>;  // { age: number; score: number }
type BooleanFields = PickByValue<Entity, boolean>; // { active: boolean }

// Nullable — map only optional keys to nullable
type OptionalToNullable<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
};

// Validation schema from a type
type ValidationRules<T> = {
  [K in keyof T]: {
    required: boolean;
    validate?: (val: T[K]) => string | null;
  };
};
type UserValidation = ValidationRules<Pick<Entity, 'id' | 'name' | 'age'>>;
const rules: UserValidation = {
  id:   { required: true },
  name: { required: true, validate: v => v.length > 0 ? null : 'Required' },
  age:  { required: false, validate: v => v >= 0 ? null : 'Must be positive' },
};

// Deep mapped type example
type DeepMutable<T> = {
  -readonly [K in keyof T]: T[K] extends object ? DeepMutable<T[K]> : T[K];
};`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting `string & K` when using Capitalize in remapping',
      wrong: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<K>}\`]: () => T[K];
  // Error: Type 'K' does not satisfy the constraint 'string'
};`,
      right: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
  // string & K narrows K to its string members — symbol and number excluded
};`,
      explanation: 'keyof T includes string, number, and symbol keys. Capitalize only accepts string. Use string & K to intersect and narrow K to its string members before passing to Capitalize.',
    },
    {
      title: 'Using non-homomorphic mapped type when you want to preserve modifiers',
      wrong: `// Building an "optional version" of T using a union (non-homomorphic)
type MyPartial<T> = { [K in keyof T & string]?: T[K] };
// keyof T & string forces non-homomorphic — loses readonly modifiers from T`,
      right: `// Homomorphic — iterates directly over keyof T, preserves readonly
type MyPartial<T> = { [K in keyof T]?: T[K] };`,
      explanation: 'Iterating over a derived union (keyof T & string, keyof T & symbol) instead of keyof T directly makes the mapped type non-homomorphic — it loses optional and readonly modifiers from the source type.',
    },
    {
      title: 'Indexed access with a string that may not be a key',
      wrong: `function getValue<T>(obj: T, key: string): unknown {
  return obj[key]; // Error: Element implicitly has an 'any' type because T has no index signature
}`,
      right: `function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // OK — K is constrained to keys of T
}`,
      explanation: 'Arbitrary string indexing on a typed object is disallowed without an index signature. Constrain the key parameter to K extends keyof T so TypeScript knows the key is valid and can infer the return type as T[K].',
    },
    {
      title: 'Expecting mapped types to work like for...in at runtime',
      wrong: `type Doubled<T> = { [K in keyof T]: T[K] };
// Expecting runtime transformation — but mapped types are compile-time only!
const original = { x: 1, y: 2 };
const doubled: Doubled<typeof original> = original; // No transformation happened`,
      right: `// Mapped types define the SHAPE — you still need runtime code to transform values
function mapValues<T, U>(obj: T, fn: (val: T[keyof T]) => U): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(obj as object).map(([k, v]) => [k, fn(v)])
  ) as Record<keyof T, U>;
}
const doubled = mapValues({ x: 1, y: 2 }, v => v * 2); // { x: 2, y: 2 }`,
      explanation: 'Mapped types are compile-time type transformations — they describe the shape but do not execute any code. You need separate runtime code to actually transform values at runtime.',
    },
    {
      title: 'Using `as never` filter incorrectly — filtering the wrong thing',
      wrong: `// Trying to keep only required properties (those without ?)
type RequiredKeys<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
};
// This logic is inverted — {} extends Pick<T,K> means K is optional`,
      right: `// Correct: {} extends Pick<T,K> is true when K is optional (Pick<T,K> = {K?: ...})
type RequiredOnly<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
  // never for optional (removes them), K for required (keeps them)
};
interface Foo { a: string; b?: number; c: boolean }
type OnlyRequired = RequiredOnly<Foo>; // { a: string; c: boolean }`,
      explanation: 'The pattern {} extends Pick<T, K> checks if Pick<T, K> (a single-property type) is assignable to {} (empty object). Optional properties make Pick<T, K> compatible with {} — this identifies optional keys. Use this carefully and test with simple examples first.',
    },
    {
      title: 'Forgetting that mapped types over arrays produce objects, not arrays',
      wrong: `type DoubleEach<T extends number[]> = { [K in keyof T]: number };
// This gives { 0: number; 1: number; length: number; ... }
// NOT number[] — it is an object with numeric-ish keys`,
      right: `// For homogeneous array transformation, use a simple generic type
type DoubleEach<T extends number[]> = number[];

// For actual per-element tuple transformation, use variadic tuples
type AddString<T extends unknown[]> = { [K in keyof T]: T[K] | string };
// Works for tuples: AddString<[number, boolean]> = [number | string, boolean | string]`,
      explanation: 'Applying a mapped type to an array type produces an object type with numeric index keys plus array methods (length, push, etc.) — not a clean array type. For tuple element transformation, mapped types work; for generic arrays, use array-level generics.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a typed form state manager',
    language: 'typescript',
    description: 'Using mapped types, create a FormState<T> type that wraps each field of T into a field descriptor with value, error, and touched properties. Then implement a createForm<T>(initial: T) function that returns a FormState<T> with methods: setValue<K>(key, value), setError<K>(key, error), and getValues() that returns Partial<T>.',
    hints: [
      'FormState<T> = { [K in keyof T]: { value: T[K]; error: string | null; touched: boolean } }',
      'createForm<T>(initial: T) wraps each key of initial in a FieldDescriptor',
      'setValue<K extends keyof T>(key: K, value: T[K]) — typed per key',
      'getValues() returns the collected values as Partial<T>',
    ],
    starterCode: `interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// TODO: define FieldDescriptor<V> and FormState<T>
// TODO: implement createForm<T>(initial: T): FormState<T> with methods

const form = createForm<LoginForm>({
  email: '', password: '', rememberMe: false,
});

form.setValue('email', 'user@example.com');
// form.setValue('email', 42); // should error — email must be string

form.setError('password', 'Too short');
const vals = form.getValues(); // Partial<LoginForm>`,
    solution: `interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FieldDescriptor<V> {
  value: V;
  error: string | null;
  touched: boolean;
}

type FormState<T> = {
  [K in keyof T]: FieldDescriptor<T[K]>;
} & {
  setValue<K extends keyof T>(key: K, value: T[K]): void;
  setError<K extends keyof T>(key: K, error: string | null): void;
  touch<K extends keyof T>(key: K): void;
  getValues(): Partial<T>;
  getErrors(): Partial<Record<keyof T, string>>;
};

function createForm<T extends object>(initial: T): FormState<T> {
  const state = Object.fromEntries(
    Object.entries(initial).map(([k, v]) => [k, { value: v, error: null, touched: false }])
  ) as { [K in keyof T]: FieldDescriptor<T[K]> };

  const methods = {
    setValue<K extends keyof T>(key: K, value: T[K]) {
      state[key] = { ...state[key], value, touched: true };
    },
    setError<K extends keyof T>(key: K, error: string | null) {
      state[key] = { ...state[key], error };
    },
    touch<K extends keyof T>(key: K) {
      state[key] = { ...state[key], touched: true };
    },
    getValues(): Partial<T> {
      return Object.fromEntries(
        Object.entries(state).map(([k, f]) => [k, (f as FieldDescriptor<unknown>).value])
      ) as Partial<T>;
    },
    getErrors(): Partial<Record<keyof T, string>> {
      return Object.fromEntries(
        Object.entries(state)
          .filter(([, f]) => (f as FieldDescriptor<unknown>).error !== null)
          .map(([k, f]) => [k, (f as FieldDescriptor<unknown>).error])
      ) as Partial<Record<keyof T, string>>;
    },
  };

  return Object.assign(state, methods) as FormState<T>;
}

const form = createForm<LoginForm>({ email: '', password: '', rememberMe: false });
form.setValue('email', 'user@example.com'); // OK
// form.setValue('email', 42);              // Error — must be string
form.setError('password', 'Too short');
console.log(form.getValues());   // { email: 'user@example.com', password: '', rememberMe: false }
console.log(form.getErrors());   // { password: 'Too short' }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `{ [K in keyof T]-?: T[K] }` do?',
      options: [
        'Removes all properties from T',
        'Removes the optional modifier from all properties, making them required',
        'Removes the readonly modifier from all properties',
        'Creates a type with only required properties of T',
      ],
      answer: 1,
      explanation: 'The -? modifier removes the optional (?) flag from all properties. This is exactly how Required<T> is implemented in TypeScript\'s standard library.',
    },
    {
      q: 'What does `[K in keyof T as `get${Capitalize<string & K>}`]` do?',
      options: [
        'Filters out non-string keys and renames each key from "name" to "getName"',
        'Adds a "get" prefix to all keys',
        'Creates a union of all key names with "get" prepended',
        'Filters out all keys that do not start with "get"',
      ],
      answer: 0,
      explanation: 'The as clause remaps keys using a template literal. string & K narrows K to only string keys (excluding symbol/number). Capitalize<string & K> capitalizes the first letter. The template literal prepends "get", turning "name" into "getName".',
    },
    {
      q: 'What is `User["profile"]["bio"]` in TypeScript?',
      options: [
        'The runtime value of bio',
        'An indexed access type — the type of User.profile.bio',
        'A mapped type over User',
        'A conditional type check',
      ],
      answer: 1,
      explanation: 'T[K] is an indexed access type — it retrieves the type of property K at compile time. User["profile"]["bio"] chains two indexed accesses: first to get the profile type, then to get bio\'s type from that.',
    },
    {
      q: 'What is the difference between a homomorphic and non-homomorphic mapped type?',
      options: [
        'Homomorphic uses a union; non-homomorphic uses keyof T',
        'Homomorphic iterates over keyof T (preserves modifiers); non-homomorphic iterates over a custom union (fresh type, no modifiers)',
        'There is no difference — they produce identical types',
        'Homomorphic only works with interfaces; non-homomorphic works with type aliases',
      ],
      answer: 1,
      explanation: 'A homomorphic mapped type (keyof T) carries over optional and readonly modifiers from the source type. A non-homomorphic mapped type (custom union, not keyof T) creates a fresh type without inherited modifiers.',
    },
    {
      q: 'How do you filter out keys from a mapped type?',
      options: [
        'Use Exclude<keyof T, K> on the union',
        'Use the delete keyword inside the mapped type',
        'Map the key to never using the `as never` key remapping clause',
        'Use -K inside the mapped type',
      ],
      answer: 2,
      explanation: 'In a key remapping clause (as NewKey), mapping a key to never removes it from the resulting type. For example: [K in keyof T as T[K] extends string ? K : never] keeps only string-valued properties.',
    },
    {
      q: 'What does `SomeArray[number]` give you?',
      options: [
        'The length of the array',
        'The element type of the array',
        'The first element of the array',
        'A numeric index type',
      ],
      answer: 1,
      explanation: 'Indexing an array type with number gives the element type. string[][number] is string. For tuples, T[number] gives the union of all element types.',
    },
    {
      q: 'Why does applying a mapped type to an array type NOT produce an array?',
      options: [
        'Mapped types cannot be applied to arrays',
        'The mapped type iterates over array keys (0, 1, 2, length, push, ...) and produces an object type with those as properties',
        'TypeScript automatically converts arrays to tuples in mapped types',
        'You need to use ReadonlyArray to get array output from a mapped type',
      ],
      answer: 1,
      explanation: 'Mapped types over arrays iterate over ALL keys of the array — including numeric indices AND built-in array method names (length, push, pop, etc.). The result is an object type, not an array. For tuple element transformation, mapped types work correctly because tuples have known indices.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I write a custom mapped type vs using a built-in utility type?',
      a: 'Use built-in utility types (Partial, Required, Readonly, Pick, Omit, Record) when they match your need — they are well-known and communicate intent clearly. Write a custom mapped type when: (1) you need to transform values (not just add/remove modifiers), (2) you need key remapping, (3) you need to filter by value type, or (4) you need a deep/recursive transformation.',
    },
    {
      q: 'What is the -? modifier and when is it useful?',
      a: '-? removes the optional modifier from a property. It is the building block of Required<T>. Useful when you have a partial config type and want to enforce that all fields are populated after merging with defaults: type Resolved<T> = { [K in keyof T]-?: NonNullable<T[K]> } removes both optional and null/undefined.',
    },
    {
      q: 'How does key remapping with `as` work?',
      a: 'The as clause in a mapped type ([K in keyof T as NewKey]) transforms the key type before it appears in the output. NewKey is typically a template literal type derived from K. If NewKey resolves to never, that key is excluded. This enables key renaming (getters/setters) and key filtering (keep only string properties) in a single mapped type.',
    },
    {
      q: 'What is the difference between `T[keyof T]` and iterating with a mapped type?',
      a: 'T[keyof T] is a union of all value types in T — a single type, not a structure. Iterating with { [K in keyof T]: ... } produces a new object type that preserves the key-value structure. T[keyof T] is for extracting "what values can appear in T"; mapped types are for transforming the structure of T.',
    },
    {
      q: 'Can mapped types be recursive?',
      a: 'Yes. You can write recursive mapped types by referencing the mapped type inside its own definition: type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] }. TypeScript limits recursion depth — very deeply nested types may hit the limit. For practical cases (config objects, domain types), recursion terminates naturally.',
    },
    {
      q: 'Why does `[K in keyof T as string & K]` make a type non-homomorphic?',
      a: 'Iterating over a derived union (string & K, where K comes from keyof T) instead of keyof T directly makes TypeScript treat it as a new non-homomorphic iteration. The compiler no longer recognizes it as "transforming T" and stops carrying over optional/readonly modifiers. Always iterate directly over keyof T for homomorphic behavior.',
    },
    {
      q: 'How do I extract only the optional keys from a type?',
      a: 'Use the pattern: { [K in keyof T as {} extends Pick<T, K> ? K : never]: T[K] }. {} extends Pick<T, K> is true when K is optional (because Pick<T, K> produces { K?: T[K] }, which is assignable to {}). This filters to only optional keys. For required keys, flip the condition to ? never : K.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Mapped types iterate over key unions to transform types — [K in keyof T] for homomorphic (preserves modifiers), as NewKey for remapping/filtering, T[K] for indexed access, and -? / -readonly to remove modifiers.',
    mustKnow: [
      '{ [K in keyof T]?: T[K] } adds optional; { [K in keyof T]-?: T[K] } removes it',
      'Key remapping with as — [K in keyof T as NewKey] renames; as never filters the key out',
      'string & K is required when using Capitalize/Uppercase in remapping (K includes symbol/number)',
      'Homomorphic (keyof T) preserves modifiers; non-homomorphic (custom union) does not',
      'T[K] indexed access — T["name"] gives the type of the name property; SomeArray[number] gives element type',
      'Mapped types are compile-time only — no runtime transformation happens',
      'Applying a mapped type to an array produces an object with array keys, not a clean array type',
    ],
    interviewFocus: [
      'What is a mapped type and how do you add or remove modifiers?',
      'How does key remapping with `as` work in mapped types?',
      'What is the difference between homomorphic and non-homomorphic mapped types?',
      'How do you filter keys in a mapped type using `as never`?',
      'What does T[K] give you and how is it different from T[keyof T]?',
    ],
  };
}
