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
  selector: 'app-ts-generics',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './generics.html',
  styleUrl: './generics.scss',
})
export class TsGenerics {
  quickRef: QuickRefItem[] = [
    { name: 'function id<T>(x: T): T',    type: 'syntax',      desc: 'Generic function — T is inferred from the argument at the call site' },
    { name: 'T extends U',                 type: 'constraint',  desc: 'Constrain T to types that extend (are assignable to) U' },
    { name: 'T extends keyof U',           type: 'constraint',  desc: 'Constrain T to the key union of type U' },
    { name: 'interface Box<T>',            type: 'interface',   desc: 'Generic interface — Box<string> or Box<number> at usage site' },
    { name: 'class Stack<T>',              type: 'class',       desc: 'Generic class — T is shared across all methods of the instance' },
    { name: '<T = string>',                type: 'syntax',      desc: 'Default type parameter — used when T is not inferred or provided' },
    { name: 'Array<T>',                    type: 'type',        desc: 'Built-in generic — equivalent to T[]; generic over element type' },
    { name: 'Promise<T>',                  type: 'type',        desc: 'Built-in generic — Promise<User> means resolved value is User' },
    { name: 'new () => T',                 type: 'syntax',      desc: 'Constructor signature — a type that can be called with new to produce T' },
    { name: 'infer',                       type: 'keyword',     desc: 'Declare a type variable inside extends — used in conditional types' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What generics are — write once, use for any type',
      points: [
        'Generics let you write a function, class, or interface once and use it with any type — without losing type safety. The type parameter <code>&lt;T&gt;</code> is a placeholder filled in at the call site: <code>function identity&lt;T&gt;(x: T): T { return x; }</code>.',
        'Without generics you would write <code>identityString(x: string): string</code>, <code>identityNumber(x: number): number</code>, etc. — duplicating logic for every type. With generics, one function handles all types safely.',
        'TypeScript infers the type parameter from the argument: <code>identity("hello")</code> infers <code>T = string</code>. You can also provide it explicitly: <code>identity&lt;string&gt;("hello")</code>. Explicit annotation is needed when inference is ambiguous or when providing default generics.',
        'Type parameters are erased at compile time — they have no runtime representation. Generics are purely a compile-time tool for expressing relationships between types.',
      ],
    },
    {
      heading: 'Generic constraints — T extends U',
      points: [
        'Without constraints, TypeScript only knows that T is "some type" — you cannot call methods on it or access properties. Use <code>T extends SomeType</code> to restrict T to types that are assignable to SomeType.',
        '<code>function getLength&lt;T extends { length: number }&gt;(x: T): number { return x.length; }</code> — T can be string, array, or any object with a length property. The constraint is structural (shape-based), not nominal.',
        '<code>T extends keyof U</code> restricts T to the key union of U. This is the basis of <code>function getProperty&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> — TypeScript knows the return type is precisely <code>T[K]</code>, not any.',
        'Multiple constraints are expressed with intersection: <code>T extends Serializable &amp; Loggable</code>. T must satisfy both interfaces.',
      ],
    },
    {
      heading: 'Generic interfaces and type aliases',
      points: [
        'Interfaces and type aliases can be generic: <code>interface Repository&lt;T&gt; { findById(id: string): Promise&lt;T&gt;; save(entity: T): Promise&lt;void&gt;; }</code>. The type parameter makes the interface reusable across different entity types.',
        'Type aliases are also generic: <code>type Nullable&lt;T&gt; = T | null</code>, <code>type Result&lt;T, E = Error&gt; = { ok: true; value: T } | { ok: false; error: E }</code>. Default type parameters (<code>E = Error</code>) are filled in when the type argument is omitted.',
        'Generic interfaces can extend other generic interfaces: <code>interface PaginatedRepository&lt;T&gt; extends Repository&lt;T&gt; { findAll(page: number): Promise&lt;T[]&gt;; }</code>. The type parameter flows through.',
        'When using a generic interface as a type, you must provide the type argument or it becomes an error (unlike JavaScript which has no types): <code>const repo: Repository&lt;User&gt; = new UserRepository();</code>.',
      ],
    },
    {
      heading: 'Generic classes',
      points: [
        'A generic class shares its type parameter across all methods: <code>class Stack&lt;T&gt; { push(item: T): void; pop(): T | undefined; peek(): T | undefined; }</code>. Once you create <code>new Stack&lt;string&gt;()</code>, all methods work with strings.',
        'TypeScript infers the class type parameter from constructor arguments when possible: <code>class Pair&lt;A, B&gt; { constructor(public first: A, public second: B) {} }</code> → <code>new Pair(1, "hello")</code> infers <code>Pair&lt;number, string&gt;</code>.',
        'Static members cannot use the class type parameter — they belong to the class itself, not an instance. Use a separate type parameter on the static method if needed.',
        'Generic classes are useful for containers (Stack, Queue, Tree), repositories, and any abstraction that works with "some entity type".',
      ],
    },
    {
      heading: 'Default type parameters',
      points: [
        'Generic types can have defaults: <code>type EventMap&lt;T = Record&lt;string, unknown&gt;&gt; = T</code>. When T is not provided, it defaults to the specified type. This makes generic types ergonomic when a common case exists.',
        'Default type parameters must come after non-default ones: <code>function fetch&lt;T, E = Error&gt;</code> is valid; <code>function fetch&lt;T = unknown, E&gt;</code> is not.',
        'Defaults are used when: the type parameter cannot be inferred AND is not explicitly provided. If the call site provides an argument that allows inference, the inference wins over the default.',
        'Common patterns: <code>Result&lt;T, E = string&gt;</code> defaults E to string for simple error messages; <code>EventBus&lt;TEvents = DefaultEvents&gt;</code> defaults to a common event map.',
      ],
    },
    {
      heading: 'Generic functions as arguments — higher-order generics',
      points: [
        'Functions that accept or return generic functions are common in utility code: <code>function memoize&lt;T extends (...args: any[]) =&gt; any&gt;(fn: T): T</code> — preserves the full type signature of the wrapped function.',
        'Constructor types in generics: <code>function create&lt;T&gt;(ctor: new () =&gt; T): T { return new ctor(); }</code>. The <code>new () =&gt; T</code> constraint says "a constructor that takes no arguments and returns T".',
        'Abstract factory pattern: <code>function createWith&lt;TArgs extends unknown[], T&gt;(ctor: new (...args: TArgs) =&gt; T, ...args: TArgs): T</code>. The variadic tuple <code>TArgs</code> captures the constructor arguments.',
        'TypeScript\'s built-in generic utility types (Partial, Required, Readonly, Pick, Omit, Record, Extract, Exclude, NonNullable) are all implemented using generics. Understanding generics lets you read and extend them.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Generic Functions',
      language: 'typescript',
      code: `// Basic generic function — T inferred from argument
function identity<T>(x: T): T { return x; }
const s = identity('hello');  // T = string
const n = identity(42);       // T = number

// Multiple type parameters
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}
const p = pair(1, 'one'); // [number, string]

// Constraint — T must have a .length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest('hello', 'world'); // T = string
longest([1, 2, 3], [1]);   // T = number[]
// longest(1, 2);           // Error — number has no .length

// keyof constraint — typed property access
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'Alice', active: true };
getProperty(user, 'name');   // returns string
getProperty(user, 'active'); // returns boolean
// getProperty(user, 'age'); // Error — 'age' is not a key of typeof user`,
    },
    {
      label: 'Generic Interfaces & Types',
      language: 'typescript',
      code: `// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

interface User { id: string; name: string; email: string }

// Implement with a concrete type
class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> { /* ... */ return null; }
  async findAll(): Promise<User[]>                 { return []; }
  async save(user: User): Promise<User>            { return user; }
  async delete(id: string): Promise<void>          { /* ... */ }
}

// Generic type alias with default
type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await loadUser(id);
    return { ok: true, value: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const result = await fetchUser('1');
if (result.ok) {
  result.value.name; // User
} else {
  result.error;      // string
}`,
    },
    {
      label: 'Generic Classes',
      language: 'typescript',
      code: `// Generic Stack
class Stack<T> {
  private items: T[] = [];

  push(item: T): void   { this.items.push(item); }
  pop(): T | undefined  { return this.items.pop(); }
  peek(): T | undefined { return this.items.at(-1); }
  isEmpty(): boolean    { return this.items.length === 0; }
  get size(): number    { return this.items.length; }
}

const numStack = new Stack<number>();
numStack.push(1); numStack.push(2);
const top = numStack.pop(); // number | undefined

// Inferred from constructor
class Pair<A, B> {
  constructor(public readonly first: A, public readonly second: B) {}
  swap(): Pair<B, A> { return new Pair(this.second, this.first); }
}
const p = new Pair(1, 'hello'); // Pair<number, string> inferred
const swapped = p.swap();       // Pair<string, number>

// Generic with constraint
class MinHeap<T extends { priority: number }> {
  private items: T[] = [];
  insert(item: T): void { this.items.push(item); this.bubbleUp(); }
  extractMin(): T | undefined { /* ... */ return this.items.shift(); }
  private bubbleUp(): void { /* ... */ }
}

interface Task { id: string; priority: number; name: string }
const heap = new MinHeap<Task>();`,
    },
    {
      label: 'Constraints & keyof',
      language: 'typescript',
      code: `// Deep read — constrained property path
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) result[k] = obj[k];
  return result;
}
const user = { id: 1, name: 'Alice', email: 'a@example.com', role: 'admin' };
const slim = pick(user, ['id', 'name']); // { id: number; name: string }

// Multiple constraints via intersection
interface Printable { print(): void }
interface Serializable { serialize(): string }
function log<T extends Printable & Serializable>(val: T): string {
  val.print();
  return val.serialize();
}

// Constructor generic
function create<T>(ctor: new () => T): T {
  return new ctor();
}
class Logger { log(msg: string) { console.log(msg); } }
const logger = create(Logger); // Logger — no new keyword at call site

// Typed merge — requires both objects
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
const merged = merge({ id: 1 }, { name: 'Alice' });
// merged: { id: number } & { name: string }
merged.id;   // number
merged.name; // string`,
    },
    {
      label: 'Default & Higher-Order Generics',
      language: 'typescript',
      code: `// Default type parameter
interface EventBus<TEvents extends Record<string, unknown[]> = Record<string, unknown[]>> {
  on<K extends keyof TEvents>(event: K, cb: (...args: TEvents[K]) => void): void;
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
}

// Higher-order: memoize — preserves full generic signature
function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();
  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
function expensiveCalc(a: number, b: number): number { return a + b; }
const memo = memoize(expensiveCalc); // (a: number, b: number) => number

// Variadic constructor factory
function createWith<TArgs extends unknown[], T>(
  ctor: new (...args: TArgs) => T,
  ...args: TArgs
): T {
  return new ctor(...args);
}
class Connection { constructor(public url: string, public timeout: number) {} }
const conn = createWith(Connection, 'http://api.example.com', 5000);
// conn: Connection — url and timeout typed`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using any instead of a generic — loses type safety',
      wrong: `function first(arr: any[]): any {
  return arr[0]; // loses type — caller gets any
}
const x = first([1, 2, 3]);
x.toUpperCase(); // No error — x is any, silently wrong`,
      right: `function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const x = first([1, 2, 3]);
// x: number | undefined — type is preserved
// x.toUpperCase(); // Error — number has no toUpperCase`,
      explanation: 'any defeats type checking. Generics preserve the relationship between input and output types. Use a generic whenever the return type depends on an input type.',
    },
    {
      title: 'Accessing properties without a constraint',
      wrong: `function getLength<T>(x: T): number {
  return x.length; // Error: Property 'length' does not exist on type 'T'
}`,
      right: `function getLength<T extends { length: number }>(x: T): number {
  return x.length; // OK — constraint guarantees .length exists
}`,
      explanation: 'Without a constraint, TypeScript only knows T is "some type" — it refuses to access any property. Add a constraint to tell TypeScript what T is guaranteed to have.',
    },
    {
      title: 'Not constraining generic object spread — losing type info',
      wrong: `function merge<T, U>(a: T, b: U) {
  return { ...a, ...b }; // returns {} — no intersection type
}`,
      right: `function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b } as T & U;
}`,
      explanation: 'Without the extends object constraint, TypeScript cannot spread T and U because they might be primitives. The constraint also enables the correct return type T & U.',
    },
    {
      title: 'Relying on generic inference when it cannot work',
      wrong: `function makeArray<T>(): T[] {
  return []; // T cannot be inferred — no argument to infer from
}
const arr = makeArray(); // T = unknown — not helpful`,
      right: `// Option 1: provide type argument explicitly
const arr = makeArray<string>();

// Option 2: accept a type sample to drive inference
function makeArray<T>(sample: T): T[] {
  return [sample];
}
const arr2 = makeArray('hello'); // T = string — inferred`,
      explanation: 'TypeScript infers generic type parameters from function arguments. If there is no argument that involves T, inference cannot work — you must provide the type explicitly or redesign the function.',
    },
    {
      title: 'Using a static method with the class type parameter',
      wrong: `class Registry<T> {
  static instance: Registry<T>; // Error: Static members cannot reference type parameters
  static getInstance(): Registry<T> { /* ... */ return new Registry(); }
}`,
      right: `class Registry<T> {
  private static _instance: Registry<unknown>;
  static getInstance<T>(): Registry<T> { // separate <T> on the static method
    return (Registry._instance ??= new Registry()) as Registry<T>;
  }
}`,
      explanation: 'Static members belong to the class constructor, not to an instance. The class type parameter is per-instance. Static methods that need a type parameter must declare their own.',
    },
    {
      title: 'Forgetting T | undefined when a generic can miss',
      wrong: `function findFirst<T>(arr: T[], pred: (x: T) => boolean): T {
  return arr.find(pred)!; // ! suppresses the undefined — dangerous
}
const found = findFirst([1, 2, 3], x => x > 10);
found.toFixed(); // runtime error — found is undefined!`,
      right: `function findFirst<T>(arr: T[], pred: (x: T) => boolean): T | undefined {
  return arr.find(pred);
}
const found = findFirst([1, 2, 3], x => x > 10);
found?.toFixed(); // safe — optional chaining handles undefined`,
      explanation: 'When a generic function might not find a value, the return type must include undefined. Non-null assertion (!) is a code smell that trades type safety for silence.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a type-safe in-memory cache',
    language: 'typescript',
    description: 'Implement a Cache<TMap extends Record<string, unknown>> class where TMap defines which keys map to which value types. The get(key) method must return the precise type for that key. The set(key, value) method must enforce the correct value type. Add a has(key) type predicate and a getOrSet(key, factory) method that populates missing entries.',
    hints: [
      'TMap extends Record<string, unknown> constrains the map to string keys with any values',
      'get<K extends keyof TMap>(key: K): TMap[K] | undefined — indexed access type gives the per-key return type',
      'set<K extends keyof TMap>(key: K, value: TMap[K]): void — same pattern for set',
      'has<K extends keyof TMap>(key: K): key is K — type predicate (though simpler: boolean is fine)',
    ],
    starterCode: `type AppCache = {
  user:     { id: string; name: string };
  token:    string;
  expiry:   number;
  settings: { theme: 'light' | 'dark'; lang: string };
};

// TODO: implement Cache<TMap> class
// get<K extends keyof TMap>(key: K): TMap[K] | undefined
// set<K extends keyof TMap>(key: K, value: TMap[K]): void
// has(key: keyof TMap): boolean
// getOrSet<K extends keyof TMap>(key: K, factory: () => TMap[K]): TMap[K]

const cache = new Cache<AppCache>();
cache.set('token', 'abc123');
cache.set('expiry', Date.now() + 3600_000);
// cache.set('token', 42); // should error — token must be string

const token = cache.get('token');  // string | undefined
const user  = cache.get('user');   // { id: string; name: string } | undefined`,
    solution: `type AppCache = {
  user:     { id: string; name: string };
  token:    string;
  expiry:   number;
  settings: { theme: 'light' | 'dark'; lang: string };
};

class Cache<TMap extends Record<string, unknown>> {
  private store = new Map<keyof TMap, TMap[keyof TMap]>();

  get<K extends keyof TMap>(key: K): TMap[K] | undefined {
    return this.store.get(key) as TMap[K] | undefined;
  }

  set<K extends keyof TMap>(key: K, value: TMap[K]): void {
    this.store.set(key, value);
  }

  has(key: keyof TMap): boolean {
    return this.store.has(key);
  }

  delete(key: keyof TMap): boolean {
    return this.store.delete(key);
  }

  getOrSet<K extends keyof TMap>(key: K, factory: () => TMap[K]): TMap[K] {
    if (this.has(key)) return this.get(key) as TMap[K];
    const value = factory();
    this.set(key, value);
    return value;
  }

  clear(): void { this.store.clear(); }
}

const cache = new Cache<AppCache>();
cache.set('token', 'abc123');
cache.set('expiry', Date.now() + 3600_000);
// cache.set('token', 42); // Error: Argument of type 'number' is not assignable to parameter of type 'string'

const token = cache.get('token');  // string | undefined
const user  = cache.get('user');   // { id: string; name: string } | undefined

const settings = cache.getOrSet('settings', () => ({
  theme: 'dark' as const,
  lang: 'en',
}));
console.log(settings.theme); // 'dark'`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `function identity<T>(x: T): T` do that `function identity(x: any): any` does not?',
      options: [
        'It prevents passing objects',
        'It preserves the relationship between input and output type — caller gets the same type back',
        'It runs faster at runtime',
        'It prevents passing undefined',
      ],
      answer: 1,
      explanation: 'The generic version returns T — the same type as the input. any returns any, which discards all type information. Generics preserve type relationships without sacrificing type safety.',
    },
    {
      q: 'Why does TypeScript error on `function getLen<T>(x: T) { return x.length; }`?',
      options: [
        'TypeScript does not support .length',
        'T is constrained to primitives by default',
        'Without a constraint, T is "some type" — TypeScript cannot guarantee .length exists',
        'The function is missing a return type annotation',
      ],
      answer: 2,
      explanation: 'Without a constraint, T could be any type — including number or boolean which have no .length. Adding T extends { length: number } tells TypeScript that T is guaranteed to have that property.',
    },
    {
      q: 'When does TypeScript use a default type parameter?',
      options: [
        'Always — defaults override inferred types',
        'When T cannot be inferred from arguments AND is not explicitly provided',
        'When strict mode is enabled',
        'When the generic is used inside a class',
      ],
      answer: 1,
      explanation: 'Default type parameters are used when the type parameter cannot be inferred from the call site and is not explicitly provided. If TypeScript can infer T from an argument, the inference wins over the default.',
    },
    {
      q: 'What does `K extends keyof T` constrain K to?',
      options: [
        'K must extend the T class',
        'K must be a subtype of T',
        'K must be one of the property keys of T',
        'K must be a string that starts with the same letter as T',
      ],
      answer: 2,
      explanation: 'keyof T produces a union of all keys of T. K extends keyof T means K must be one of those keys. This makes T[K] safe to access — TypeScript knows K is a valid key.',
    },
    {
      q: 'Can static class methods use the class-level type parameter?',
      options: [
        'Yes — all methods share the class type parameter',
        'No — static members belong to the class constructor, not instances; they need their own type parameter',
        'Yes — but only with the static keyword on the type parameter',
        'No — static methods cannot be generic at all',
      ],
      answer: 1,
      explanation: 'Static members are on the class itself, not on instances. The class type parameter is per-instance. Static methods that need a type parameter must declare their own separate generic parameter.',
    },
    {
      q: 'What is `new () => T` in a generic constraint?',
      options: [
        'A function that returns a new T',
        'A constructor signature — a type that can be called with new to produce T',
        'A type alias for creating T',
        'A factory method interface',
      ],
      answer: 1,
      explanation: '`new () => T` is a constructor type signature. A function<T>(ctor: new () => T) accepts any class (constructor) that takes no arguments and produces a T instance.',
    },
    {
      q: 'What is the return type of `function first<T>(arr: T[]): T | undefined { return arr[0]; }`?',
      options: [
        'T',
        'T | null',
        'T | undefined',
        'T[]',
      ],
      answer: 2,
      explanation: 'arr[0] returns T | undefined because the array might be empty. The return type T | undefined is correct and safe — the caller must handle the undefined case. Using T with a non-null assertion (!) would be unsafe.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between generics and any?',
      a: 'any disables type checking entirely — you lose all type information. Generics preserve type relationships: the input type is captured as T and flows through to the output. With any, the caller gets an untyped result and TypeScript cannot catch misuse. With generics, the caller gets the specific type back and TypeScript enforces correct usage throughout.',
    },
    {
      q: 'When should I use a generic constraint vs a union type?',
      a: 'Use a constraint when the return type depends on the specific subtype of the input — you want T to flow through. Use a union when the function accepts one of several specific types and the return type is fixed. For example, function getLength<T extends string | number[]>(x: T) is better as a union (string | number[]) unless the return type needs to be T.',
    },
    {
      q: 'How do I constrain a generic to only object types?',
      a: 'Use T extends object. This excludes primitives (string, number, boolean, symbol, bigint, null, undefined) and allows only non-primitive types (objects, arrays, functions, classes). This is commonly needed when using spread { ...a, ...b } which only works on objects.',
    },
    {
      q: 'What is the difference between `Array<T>` and `T[]`?',
      a: 'They are identical — TypeScript treats them as the same type. T[] is syntactic sugar for Array<T>. The only difference is style: T[] is more common for simple cases; Array<T> is preferred when the type is complex (e.g., Array<Map<string, number>> is clearer than Map<string, number>[]).',
    },
    {
      q: 'Can a generic have multiple type parameters?',
      a: 'Yes. function pair<A, B>(first: A, second: B): [A, B] has two independent type parameters. Each is inferred from its corresponding argument. You can have as many type parameters as needed, and each can have its own constraint.',
    },
    {
      q: 'What happens if TypeScript cannot infer a generic type parameter?',
      a: 'TypeScript falls back to the default type parameter if one is defined (e.g., <T = unknown>). Otherwise, it infers unknown or errors depending on context. You should provide the type explicitly in these cases: makeArray<string>().',
    },
    {
      q: 'Are generics erased at runtime like interfaces?',
      a: 'Yes. Generic type parameters are a compile-time construct and are completely erased in the JavaScript output. At runtime, there is no T — all generic code runs as plain JavaScript. This is why you cannot do typeof T or instanceof T — those checks require runtime values, but T has no runtime representation.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Generics let you write type-safe code that works across types — T is inferred from arguments, constrained with extends, and flows through to return types and related interfaces.',
    mustKnow: [
      'T is a type placeholder — filled in at the call site by inference or explicit annotation',
      'T extends U constrains T to types assignable to U — required to access properties on T',
      'T extends keyof U constrains T to the key union of U — enables safe indexed access T[K]',
      'Default type parameters (<T = string>) are used when T cannot be inferred and is not provided',
      'Static class methods cannot use the class type parameter — they need their own <T>',
      'Generic type parameters are erased at compile time — no runtime representation',
      'new () => T is a constructor signature type — used for factory functions',
    ],
    interviewFocus: [
      'What is the difference between a generic function and a function that takes any?',
      'How do you constrain a generic type parameter and why is it needed?',
      'How does TypeScript infer generic type parameters?',
      'Can static class members use the class-level type parameter?',
      'What is T extends keyof U and when do you use it?',
    ],
  };
}
