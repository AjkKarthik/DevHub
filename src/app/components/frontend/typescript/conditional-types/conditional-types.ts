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
  selector: 'app-ts-conditional-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './conditional-types.html',
  styleUrl: './conditional-types.scss',
})
export class TsConditionalTypes {
  quickRef: QuickRefItem[] = [
    { name: 'T extends U ? X : Y',       type: 'syntax',  desc: 'Conditional type — X if T is assignable to U, otherwise Y' },
    { name: 'infer R',                    type: 'keyword', desc: 'Declare a type variable inside extends clause — TypeScript infers its value' },
    { name: 'T extends infer R ? R : T', type: 'syntax',  desc: 'Copy T into R — lets you transform T while keeping the original' },
    { name: 'distributive',               type: 'keyword', desc: 'When T is a type parameter, conditional types distribute over union members' },
    { name: '[T] extends [U]',           type: 'syntax',  desc: 'Tuple wrapping — disables distribution; checks whole union at once' },
    { name: 'never',                      type: 'keyword', desc: 'A branch that resolves to never is excluded from the resulting union' },
    { name: 'Exclude<T, U>',             type: 'type',    desc: 'Built-in: T extends U ? never : T — removes U-assignable members from T' },
    { name: 'Extract<T, U>',             type: 'type',    desc: 'Built-in: T extends U ? T : never — keeps U-assignable members of T' },
    { name: 'NonNullable<T>',            type: 'type',    desc: 'Built-in: Exclude<T, null | undefined>' },
    { name: 'deferred conditional',       type: 'keyword', desc: 'When T is not yet known, TypeScript defers resolution until the type is concrete' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Conditional types — type-level if/else',
      points: [
        'A conditional type is <code>T extends U ? X : Y</code> — if T is assignable to U, the type resolves to X, otherwise to Y. It is the type-level equivalent of a ternary expression.',
        'Conditional types can be nested: <code>T extends string ? "str" : T extends number ? "num" : "other"</code>. This is like a switch statement at the type level.',
        'The check is structural, not nominal — <code>T extends { id: string }</code> is true for any type that has an id property of type string, regardless of what T is called.',
        'Conditional types are evaluated lazily when T is a concrete type. When T is a type parameter, resolution is deferred until the type is instantiated (see deferred section below).',
      ],
    },
    {
      heading: 'infer — declare type variables inside extends',
      points: [
        'The <code>infer</code> keyword declares a type variable inside a conditional type\'s extends clause. TypeScript infers what the variable should be from the structure of the matched type.',
        '<code>type UnwrapPromise&lt;T&gt; = T extends Promise&lt;infer R&gt; ? R : T</code> — if T is a Promise, R is bound to the resolved value type. <code>UnwrapPromise&lt;Promise&lt;string&gt;&gt;</code> → <code>string</code>.',
        'You can use multiple infer in a single conditional: <code>T extends (a: infer A, b: infer B) =&gt; infer R ? [A, B, R] : never</code> extracts argument types and return type simultaneously.',
        'infer is valid ONLY inside the extends clause of a conditional type. It cannot be used in mapped types, function signatures, or type aliases outside a conditional.',
      ],
    },
    {
      heading: 'Distributive conditional types — automatic union iteration',
      points: [
        'When the type parameter T in <code>T extends U ? X : Y</code> is a "bare type parameter" (just T, not wrapped), TypeScript automatically distributes the conditional over each union member.',
        '<code>type ToArray&lt;T&gt; = T extends unknown ? T[] : never</code>. <code>ToArray&lt;string | number&gt;</code> → <code>string[] | number[]</code>. Each union member gets its own array type.',
        'This is why <code>Exclude&lt;T, U&gt;</code> works: it is <code>T extends U ? never : T</code>. When T is a union, each member is checked independently — those assignable to U become never (filtered out), the rest survive.',
        'Distributive behavior requires a "naked" type parameter. If T is wrapped — in a tuple <code>[T]</code>, an object <code>{ t: T }</code>, or any other type — distribution does NOT occur.',
      ],
    },
    {
      heading: 'Disabling distribution — [T] extends [U]',
      points: [
        'Wrapping both sides in a tuple prevents distribution: <code>[T] extends [U] ? X : Y</code>. This checks the whole union T against U at once, not each member independently.',
        'Use this when you want to test "is T exactly U" or "is T a union" rather than applying the check distributively.',
        '<code>type IsNever&lt;T&gt; = [T] extends [never] ? true : false</code> — with distribution, <code>never extends never</code> would distribute over zero members and return never (not true). The tuple form correctly returns true for never.',
        '<code>type IsUnion&lt;T&gt; = [T] extends [T] ? (Exclude&lt;T, T&gt; extends never ? false : true) : never</code> — detects if T is a union by checking if excluding T from itself removes anything.',
      ],
    },
    {
      heading: 'Deferred conditional types',
      points: [
        'When T is a type parameter that is not yet concrete, TypeScript cannot evaluate the conditional immediately. It creates a "deferred conditional type" that is evaluated when the function is called with a concrete type.',
        'Inside the function body, a deferred conditional type is opaque — TypeScript cannot tell which branch was taken. You often need a type assertion or overloads to work around this.',
        '<code>function flatten&lt;T&gt;(arr: T[]): T extends unknown[] ? T[number] : T</code> — inside the function body, TypeScript does not know whether T is an array or not, so the return type is opaque.',
        'Overloads are the cleanest solution when you need to express a relationship between input and output that involves a conditional type: write separate overload signatures for each case, and the implementation uses a cast.',
      ],
    },
    {
      heading: 'Built-in types using conditional types and practical patterns',
      points: [
        'All of TypeScript\'s extraction utilities use infer: <code>ReturnType&lt;T&gt; = T extends (...args: any) =&gt; infer R ? R : never</code>. <code>Parameters&lt;T&gt; = T extends (...args: infer P) =&gt; any ? P : never</code>.',
        '<code>type Flatten&lt;T&gt; = T extends Array&lt;infer Item&gt; ? Item : T</code>. <code>Flatten&lt;string[]&gt;</code> → <code>string</code>; <code>Flatten&lt;number&gt;</code> → <code>number</code>.',
        '<code>type UnionToIntersection&lt;U&gt; = (U extends unknown ? (x: U) =&gt; void : never) extends (x: infer I) =&gt; void ? I : never</code> — converts a union to an intersection using contravariant position inference.',
        'Conditional types compose: <code>type DeepAwaited&lt;T&gt; = T extends Promise&lt;infer R&gt; ? DeepAwaited&lt;R&gt; : T</code> recursively unwraps nested Promises. TypeScript\'s built-in <code>Awaited&lt;T&gt;</code> works this way.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Conditional Types',
      language: 'typescript',
      code: `// Simple conditional — type-level ternary
type IsString<T> = T extends string ? true : false;
type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Nested conditional — type-level switch
type TypeName<T> =
  T extends string    ? 'string'    :
  T extends number    ? 'number'    :
  T extends boolean   ? 'boolean'   :
  T extends undefined ? 'undefined' :
  T extends null      ? 'null'      :
  T extends Function  ? 'function'  :
  'object';

type C = TypeName<string>;  // 'string'
type D = TypeName<number[]>; // 'object'

// Practical: conditional return type
function processValue<T>(val: T): T extends string ? string[] : T {
  if (typeof val === 'string') return val.split('') as never;
  return val as never;
}
// Note: 'as never' needed because TS cannot narrow conditional return types inside body

const words = processValue('hello'); // string[]
const num   = processValue(42);      // number`,
    },
    {
      label: 'infer — Extract Sub-Types',
      language: 'typescript',
      code: `// Extract the resolved type of a Promise
type Awaited2<T> = T extends Promise<infer R> ? R : T;
type R1 = Awaited2<Promise<string>>;       // string
type R2 = Awaited2<Promise<Promise<string>>>; // Promise<string> (one level)

// Recursive unwrap (like built-in Awaited<T>)
type DeepAwaited<T> = T extends Promise<infer R> ? DeepAwaited<R> : T;
type R3 = DeepAwaited<Promise<Promise<string>>>; // string

// Extract function return type
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type R4 = MyReturnType<() => string>;         // string
type R5 = MyReturnType<(x: number) => Date>;  // Date
type R6 = MyReturnType<string>;               // never — not a function

// Extract function parameters
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;
type P1 = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]

// Extract first element of tuple
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type H1 = Head<[string, number, boolean]>; // string
type H2 = Head<[]>;                        // never

// Extract rest of tuple
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;
type T1 = Tail<[string, number, boolean]>; // [number, boolean]`,
    },
    {
      label: 'Distributive Conditional Types',
      language: 'typescript',
      code: `// Distribution over union members
type ToArray<T> = T extends unknown ? T[] : never;
type A = ToArray<string | number>; // string[] | number[] — NOT (string | number)[]!

// Exclude — uses distribution to filter
type MyExclude<T, U> = T extends U ? never : T;
type B = MyExclude<'a' | 'b' | 'c', 'a' | 'b'>; // 'c'

// Extract — inverse of Exclude
type MyExtract<T, U> = T extends U ? T : never;
type C = MyExtract<string | number | boolean, string | boolean>; // string | boolean

// Distributive mapped type equivalent
type NonNullableProp<T> = { [K in keyof T]: Exclude<T[K], null | undefined> };
interface Nullable { name: string | null; age: number | undefined; active: boolean }
type NonNullable2 = NonNullableProp<Nullable>;
// { name: string; age: number; active: boolean }

// Useful: convert union members to object types
type UnionToObjects<T extends string> = T extends string
  ? { type: T; label: string }
  : never;
type ButtonTypes = UnionToObjects<'primary' | 'secondary' | 'danger'>;
// { type: 'primary'; label: string } | { type: 'secondary'; label: string } | ...`,
    },
    {
      label: 'Disabling Distribution',
      language: 'typescript',
      code: `// IsNever — distribution causes problems here
type IsNeverBad<T> = T extends never ? true : false;
type A = IsNeverBad<never>; // never — NOT true!
// Distribution over zero union members (never has none) = never

// Fix: wrap in tuple
type IsNever<T> = [T] extends [never] ? true : false;
type B = IsNever<never>;  // true — correct!
type C = IsNever<string>; // false — correct!

// IsAny — detect the 'any' type
type IsAny<T> = 0 extends (1 & T) ? true : false;
type D = IsAny<any>;    // true
type E = IsAny<string>; // false

// Check if T is exactly U (not just assignable)
type Equals<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type F = Equals<string, string>; // true
type G = Equals<string, any>;    // true (any is special)
type H = Equals<string, number>; // false

// Non-distributive check: "is T a union?"
type IsUnion<T, U = T> =
  T extends unknown
    ? ([U] extends [T] ? false : true)
    : never;
type I = IsUnion<string | number>; // boolean (true per member)
type J = IsUnion<string>;          // false`,
    },
    {
      label: 'Advanced Patterns',
      language: 'typescript',
      code: `// UnionToIntersection — convert union to intersection
// Uses contravariant position: function parameter types are contravariant
type UnionToIntersection<U> =
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never;
type A = UnionToIntersection<{ a: string } | { b: number }>;
// { a: string } & { b: number }

// OverloadUnion — extract all overload signatures (TS trick)
// Not fully reliable but useful for simple cases

// Promisify — wrap all methods in Promise
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};
interface SyncAPI { read(path: string): string; write(path: string, data: string): void }
type AsyncAPI = Promisify<SyncAPI>;
// { read(path: string): Promise<string>; write(path: string, data: string): Promise<void> }

// Path extraction from nested object
type DotPath<T, K extends keyof T = keyof T> =
  K extends string
    ? T[K] extends Record<string, unknown>
      ? K | \`\${K}.\${DotPath<T[K]>}\`
      : K
    : never;
interface Config { db: { host: string; port: number }; app: { name: string } }
type ConfigPath = DotPath<Config>; // 'db' | 'app' | 'db.host' | 'db.port' | 'app.name'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'IsNever<never> returning never instead of true',
      wrong: `type IsNever<T> = T extends never ? true : false;
type A = IsNever<never>; // never — not true!
// Distribution over zero union members (never has no members) collapses to never`,
      right: `type IsNever<T> = [T] extends [never] ? true : false;
type A = IsNever<never>;  // true
type B = IsNever<string>; // false`,
      explanation: 'never is an empty union — distributing over zero members gives never. Wrapping in a tuple [T] extends [never] disables distribution and correctly checks the whole type at once.',
    },
    {
      title: 'Using infer outside of a conditional type',
      wrong: `// infer is NOT valid here
type ExtractFirst<T extends unknown[]> = infer H;
// Error: 'infer' declarations are only permitted in the 'extends' clause of a conditional type`,
      right: `type ExtractFirst<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type A = ExtractFirst<[string, number]>; // string`,
      explanation: 'infer is only valid inside the extends clause of a conditional type. It cannot be used in mapped types, type alias bodies, or function signatures.',
    },
    {
      title: 'Expecting conditional types to narrow inside function bodies',
      wrong: `function process<T>(val: T): T extends string ? string[] : T {
  if (typeof val === 'string') {
    return val.split(''); // Error — return type is still the deferred conditional
  }
  return val; // Error — same issue
}`,
      right: `// Option 1: Use overloads for clarity
function process(val: string): string[];
function process<T>(val: T): T;
function process(val: unknown): unknown {
  if (typeof val === 'string') return val.split('');
  return val;
}

// Option 2: Unsafe cast (acceptable in implementation only)
function process2<T>(val: T): T extends string ? string[] : T {
  if (typeof val === 'string') return (val.split('') as unknown) as never;
  return (val as unknown) as never;
}`,
      explanation: 'TypeScript cannot narrow deferred conditional types inside function bodies — it does not know which branch was taken at compile time. Use function overloads for clean typing, or as never casts in the implementation.',
    },
    {
      title: 'Distributing when you want to check the whole union',
      wrong: `type HasString<T> = T extends string ? true : false;
// Testing: is "string | number" assignable to string?
type A = HasString<string | number>; // boolean (true | false) — distributes!
// You wanted to check the WHOLE union, not each member`,
      right: `type HasString<T> = [T] extends [string] ? true : false;
type A = HasString<string | number>; // false — string | number is not assignable to string
type B = HasString<string>;          // true`,
      explanation: 'When T is a bare type parameter, the conditional distributes over each union member. To check the whole union against a condition, wrap both sides in a tuple to disable distribution.',
    },
    {
      title: 'Forgetting that conditional types are resolved lazily for type parameters',
      wrong: `type Wrap<T> = T extends string ? string[] : number[];
// At call site with a concrete type — resolves fine
type A = Wrap<string>; // string[]

// But inside a generic function with the SAME conditional return type:
function wrap<T>(val: T): Wrap<T> {
  return typeof val === 'string' ? [val] : [0]; // Error!
  // TypeScript cannot verify this at the function body level
}`,
      right: `// Use overloads — cleanest solution for conditional return types
function wrap(val: string): string[];
function wrap(val: number): number[];
function wrap(val: string | number): string[] | number[] {
  return typeof val === 'string' ? [val] : [0];
}`,
      explanation: 'Conditional return types are resolved lazily for type parameters. Inside the function body, TypeScript has a deferred unknown — it cannot narrow it. Function overloads express the same intent without the deferred type problem.',
    },
    {
      title: 'Using conditional types where a simple union would do',
      wrong: `// Overly complex — conditional type for a simple output
type StringOrNumber<T> = T extends string ? string : T extends number ? number : never;
// This is just the same as: T extends string | number ? T : never`,
      right: `// Simple and clear
type StringOrNumber<T> = T extends string | number ? T : never;
// Even simpler: just use Extract
type StringOrNumber2<T> = Extract<T, string | number>;`,
      explanation: 'Nested conditional types for simple union membership checks are over-engineering. A single extends check with a union, or Extract<T, string | number>, is clearer and has the same behavior.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a deep type unwrapper',
    language: 'typescript',
    description: 'Using conditional types and infer, implement: (1) Unbox<T> that recursively unwraps a Box<T> wrapper type until the inner type is not a Box. (2) LastInTuple<T> that extracts the last element type from a tuple. (3) FlattenAll<T> that flattens nested arrays: FlattenAll<string[][]> → string, FlattenAll<number[][][]> → number.',
    hints: [
      'Unbox<T>: T extends Box<infer U> ? Unbox<U> : T — recurse until T is not a Box',
      'LastInTuple: T extends [...unknown[], infer L] ? L : never — rest in head position',
      'FlattenAll: T extends (infer U)[] ? FlattenAll<U> : T — recurse as long as T is an array',
    ],
    starterCode: `interface Box<T> { value: T }

// TODO 1: Unbox<T> — recursively unwrap Box<Box<Box<string>>> to string
// TODO 2: LastInTuple<T> — get the last element type of a tuple
// TODO 3: FlattenAll<T> — recursively flatten nested arrays

// Expected:
type A = Unbox<Box<Box<Box<string>>>>; // string
type B = Unbox<number>;                // number (not wrapped)

type C = LastInTuple<[string, number, boolean]>; // boolean
type D = LastInTuple<[string]>;                  // string
type E = LastInTuple<[]>;                        // never

type F = FlattenAll<string[][][]>;  // string
type G = FlattenAll<number[]>;      // number
type H = FlattenAll<boolean>;       // boolean (not an array)`,
    solution: `interface Box<T> { value: T }

// Recursively unwrap Box<T>
type Unbox<T> = T extends Box<infer U> ? Unbox<U> : T;

type A = Unbox<Box<Box<Box<string>>>>; // string
type B = Unbox<number>;                // number

// Last element of a tuple using rest in head position
type LastInTuple<T extends unknown[]> =
  T extends [...unknown[], infer L] ? L : never;

type C = LastInTuple<[string, number, boolean]>; // boolean
type D = LastInTuple<[string]>;                  // string
type E = LastInTuple<[]>;                        // never

// Recursively flatten nested arrays
type FlattenAll<T> = T extends (infer U)[] ? FlattenAll<U> : T;

type F = FlattenAll<string[][][]>;  // string
type G = FlattenAll<number[]>;      // number
type H = FlattenAll<boolean>;       // boolean

// Bonus: second-to-last element
type SecondToLast<T extends unknown[]> =
  T extends [...unknown[], infer SL, unknown] ? SL : never;
type I = SecondToLast<[string, number, boolean]>; // number

// Bonus: flatten one level only (standard Flatten)
type Flatten<T> = T extends (infer U)[] ? U : T;
type J = Flatten<string[][]>; // string[] (one level removed)
type K = Flatten<string[]>;   // string`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `T extends U ? X : Y` produce when T is `string | number` and T is a type parameter?',
      options: [
        'X | Y — always both branches',
        'X if string | number extends U; Y otherwise',
        'Distributes: (string extends U ? X : Y) | (number extends U ? X : Y)',
        'A deferred conditional type',
      ],
      answer: 2,
      explanation: 'When T is a "naked" type parameter (a union like string | number), TypeScript distributes the conditional over each member. Each member is checked independently and the results are unioned.',
    },
    {
      q: 'Why does `type IsNever<T> = T extends never ? true : false` return `never` for `IsNever<never>`?',
      options: [
        'TypeScript bug — it should return true',
        'never is an empty union — distributing over zero members produces never',
        'The extends clause does not work with never',
        'false is returned, not never',
      ],
      answer: 1,
      explanation: 'never is the empty union — it has no members to distribute over. Applying a distributive conditional to never produces never (union of zero results). Use [T] extends [never] to disable distribution and check correctly.',
    },
    {
      q: 'What does `type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never` do?',
      options: [
        'Removes the first element of a tuple',
        'Extracts the type of the first element of a tuple',
        'Creates a new tuple with one element',
        'Checks if the tuple is empty',
      ],
      answer: 1,
      explanation: 'The pattern [infer H, ...unknown[]] matches any non-empty tuple and binds the first element\'s type to H. The rest of the tuple is ignored. For an empty tuple, the match fails and never is returned.',
    },
    {
      q: 'When is a conditional type "deferred"?',
      options: [
        'When it is inside a mapped type',
        'When T is a concrete type like string',
        'When T is a type parameter that is not yet known at evaluation time',
        'When the extends clause uses infer',
      ],
      answer: 2,
      explanation: 'TypeScript defers evaluation of conditional types when T is a type parameter — its concrete type is not known until the generic is instantiated at a call site. Inside generic function bodies, the conditional is opaque.',
    },
    {
      q: 'What is `[T] extends [U]` used for?',
      options: [
        'Checking if T is a tuple',
        'Disabling distributive behavior — checking the whole T against U at once',
        'Checking if T has exactly one element',
        'Extracting the element type of T',
      ],
      answer: 1,
      explanation: 'Wrapping both sides in a tuple disables the distributive behavior of conditional types. [T] extends [U] checks whether the entire T (including unions) is assignable to U, rather than checking each union member separately.',
    },
    {
      q: 'Where can `infer` be used?',
      options: [
        'Anywhere in a type definition',
        'Only inside the extends clause of a conditional type',
        'Inside mapped types and conditional types',
        'Inside generic constraints (T extends infer U)',
      ],
      answer: 1,
      explanation: 'infer is only valid inside the extends clause of a conditional type: T extends Promise<infer R> ? R : T. It declares a new type variable that TypeScript infers from the structural match.',
    },
    {
      q: 'What does `type FlattenAll<T> = T extends (infer U)[] ? FlattenAll<U> : T` do?',
      options: [
        'Flattens an array one level',
        'Recursively flattens nested arrays until a non-array type is reached',
        'Converts a multidimensional array to a union of element types',
        'Checks if T is an array',
      ],
      answer: 1,
      explanation: 'The recursive conditional type keeps unwrapping arrays (each time binding the element type to U) until T is no longer an array. FlattenAll<string[][][]> → FlattenAll<string[][]> → FlattenAll<string[]> → FlattenAll<string> → string.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a conditional type and an overloaded function signature?',
      a: 'Both express "different return types for different inputs." Function overloads define the relationship imperatively (each overload signature is a separate case). Conditional return types express it declaratively (T extends string ? X : Y). Use overloads when the implementation body needs to be type-safe without casts. Use conditional types when the relationship is computed from the type itself, or when composing with other type utilities.',
    },
    {
      q: 'Why does TypeScript not narrow inside a function body with a conditional return type?',
      a: 'Conditional return types involving type parameters are deferred — TypeScript does not resolve them until the call site provides a concrete type. Inside the function body, the return type is still "T extends U ? X : Y" with T unknown. TypeScript cannot narrow this even after a typeof check. The solution is function overloads (which TypeScript does narrow) or unsafe casts with as never in the implementation.',
    },
    {
      q: 'What does distributive mean in the context of conditional types?',
      a: 'When the checked type T is a "naked" type parameter and T is a union like string | number, TypeScript applies the conditional to each member of the union independently and unions the results. IsString<string | number> becomes IsString<string> | IsString<number> = true | false. This is called distributive behavior and is automatic for naked type parameters.',
    },
    {
      q: 'How does UnionToIntersection work?',
      a: 'UnionToIntersection<U> uses a trick based on contravariant inference. When a type variable appears in a function parameter position (contravariant), TypeScript infers the intersection of all types that could satisfy the constraint. By mapping U extends unknown ? (x: U) => void : never and then inferring the parameter, TypeScript infers the intersection of all union members.',
    },
    {
      q: 'Can infer be used to extract multiple types at once?',
      a: 'Yes. You can have multiple infer declarations in a single conditional: type FnInfo<T> = T extends (a: infer A, b: infer B) => infer R ? [A, B, R] : never. TypeScript infers A, B, and R simultaneously from the structure of T. Each infer independently binds to the matching part of the pattern.',
    },
    {
      q: 'What happens when both branches of a conditional type resolve to the same type?',
      a: 'The conditional collapses to that type. T extends string ? string : string is just string regardless of T. TypeScript simplifies these trivial conditionals. This is sometimes useful as a constraint check: T extends ValidType ? T : never acts as a filter that only passes valid types through.',
    },
    {
      q: 'Why do I get `boolean` when I expect `true` or `false` from a conditional type?',
      a: 'When T is a union, the conditional distributes over each member independently. If some members resolve to true and others to false, the result is true | false, which TypeScript simplifies to boolean. This is the distributive behavior. Use [T] extends [U] if you want to evaluate the whole union at once and get a definite true or false.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Conditional types are type-level if/else — T extends U ? X : Y. Use infer to capture sub-types, wrap in [T] to disable distribution, and use overloads when deferred resolution makes the function body unworkable.',
    mustKnow: [
      'T extends U ? X : Y resolves to X if T is assignable to U, otherwise Y',
      'infer R declares a type variable inside extends — TypeScript binds it from the structural match',
      'Distributive: when T is a bare type parameter, conditional applies to each union member separately',
      '[T] extends [U] disables distribution — checks the whole union at once',
      'IsNever<T> must use [T] extends [never] — the bare form distributes over zero members and returns never',
      'Deferred conditional types (T is a type parameter) are opaque inside function bodies — use overloads',
      'All of ReturnType, Parameters, Awaited, Exclude, Extract are implemented with conditional types + infer',
    ],
    interviewFocus: [
      'What is a distributive conditional type and when does distribution happen?',
      'How do you disable distributive behavior in a conditional type?',
      'What is infer and where can it be used?',
      'Why does IsNever<never> return never without the tuple trick?',
      'How do you handle a conditional return type inside a generic function body?',
    ],
  };
}
