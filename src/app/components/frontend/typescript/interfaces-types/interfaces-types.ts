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
  selector: 'app-ts-interfaces-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './interfaces-types.html',
  styleUrl: './interfaces-types.scss',
})
export class TsInterfacesTypes {
  quickRef: QuickRefItem[] = [
    { name: 'interface',           type: 'keyword',   desc: 'Define an object shape — supports declaration merging and implements' },
    { name: 'type alias',          type: 'keyword',   desc: 'Name any type expression — unions, intersections, primitives, tuples' },
    { name: 'extends (interface)', type: 'keyword',   desc: 'Inherit and add properties: interface B extends A { extra: string }' },
    { name: '& (intersection)',    type: 'operator',  desc: 'Combine two types into one that has ALL properties of both' },
    { name: 'readonly',            type: 'keyword',   desc: 'Property cannot be reassigned after object creation' },
    { name: '?',                   type: 'syntax',    desc: 'Optional property — may be absent or undefined' },
    { name: '[key: string]: T',    type: 'syntax',    desc: 'Index signature — allow any string key with value type T' },
    { name: 'declaration merging', type: 'keyword',   desc: 'Two interface declarations with the same name merge into one' },
    { name: 'implements',          type: 'keyword',   desc: 'Class must satisfy the interface shape: class Foo implements Bar' },
    { name: 'keyof',               type: 'operator',  desc: 'Union of all keys of a type: keyof User gives "id" | "name" | "email"' },
    { name: 'typeof',              type: 'operator',  desc: 'Extract the TypeScript type of a value: typeof config' },
    { name: 'satisfies',           type: 'keyword',   desc: 'Validate a value matches a type without widening its inferred type (TS 4.9+)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'interface vs type — the fundamental difference',
      points: [
        'Both <code>interface</code> and <code>type</code> can describe the shape of an object. The key differences: (1) <code>interface</code> supports <em>declaration merging</em> — two declarations with the same name are automatically combined; (2) <code>type</code> cannot be reopened after definition; (3) <code>type</code> can represent any type expression (unions, tuples, primitives, mapped types), while <code>interface</code> is limited to object shapes.',
        'The TypeScript team recommends <code>interface</code> for object shapes that will be implemented by classes or extended by others, and <code>type</code> for unions, intersections, and any type expression that is not a plain object shape.',
        'A useful heuristic: if you need a union (<code>A | B</code>), conditional type, or mapped type — use <code>type</code>. If you are writing a public API contract or a shape meant to be extended by consumers — use <code>interface</code>.',
        'In practice the choice is often team convention. The most important rule: be consistent within a codebase.',
      ],
    },
    {
      heading: 'Extending and composing types',
      points: [
        '<code>interface</code> extension uses <code>extends</code>: <code>interface Admin extends User { role: "admin" }</code>. A single interface can extend multiple: <code>interface C extends A, B { ... }</code>.',
        '<code>type</code> intersection uses <code>&</code>: <code>type Admin = User & { role: "admin" }</code>. The result must satisfy every property of both sides. On primitives, <code>&</code> often gives <code>never</code> (e.g. <code>string & number</code>).',
        'When extending, the child can override a property with a <em>narrower</em> type — for example, override <code>status: string</code> with <code>status: "active" | "inactive"</code>. The child type must remain assignable to the parent.',
        'Interfaces can be self-referential (recursive): <code>interface TreeNode { value: string; children: TreeNode[] }</code>. TypeScript resolves these lazily, so circular references work fine.',
      ],
    },
    {
      heading: 'Optional, readonly, and index signatures',
      points: [
        'Optional properties use <code>?</code>: <code>{ name?: string }</code> means the value is <code>string | undefined</code>. Access safely with optional chaining (<code>obj.name?.toUpperCase()</code>) or narrow first.',
        '<code>readonly</code> properties can be set at construction time but not reassigned: <code>{ readonly id: number }</code>. This is compile-time only — the JS object is still mutable at runtime.',
        'Index signatures allow any string (or number) key: <code>{ [key: string]: unknown }</code>. Important constraint: when an index signature is present, <em>all</em> named properties must be assignable to the index value type.',
        '<code>Record&lt;K, V&gt;</code> is the shorthand utility for index signatures: <code>Record&lt;string, number&gt;</code> is equivalent to <code>{ [key: string]: number }</code>.',
      ],
    },
    {
      heading: 'Declaration merging',
      points: [
        'When two interfaces share the same name in the same scope, TypeScript merges them into one type with all their properties combined. This is declaration merging.',
        'The TypeScript standard library uses declaration merging extensively — global interfaces like <code>Window</code>, <code>HTMLElementEventMap</code>, and <code>RequestInit</code> are assembled from many separate <code>.d.ts</code> files.',
        'Module augmentation is declaration merging inside a <code>declare module</code> block: <code>declare module "express" { interface Request { user?: User } }</code>. This is the correct way to add properties to third-party types.',
        '<code>type</code> aliases cannot merge — a duplicate type alias is a compile error. This is why <code>interface</code> is preferred for types that consumers might need to extend.',
      ],
    },
    {
      heading: 'keyof, typeof, and the satisfies operator',
      points: [
        '<code>keyof T</code> produces a union of all public property names of T: <code>keyof { id: number; name: string }</code> gives <code>"id" | "name"</code>. Combine with <code>T[K]</code> (lookup type) to write generic functions that stay type-safe: <code>function get&lt;T, K extends keyof T&gt;(o: T, k: K): T[K]</code>.',
        '<code>typeof value</code> at the type level extracts the TypeScript type of a variable: <code>const config = { port: 3000 }; type Config = typeof config</code> gives <code>{ port: number }</code>. Avoids repeating the structure in a separate interface.',
        '<code>satisfies</code> (TypeScript 4.9+) validates a value against a type <em>without widening</em> the variable\'s inferred type. Use it when you want validation but need to keep the narrower type for subsequent operations.',
        'The key difference between <code>satisfies</code> and a type annotation: an annotation widens; <code>satisfies</code> checks without widening. Example: <code>palette.red</code> stays <code>[number, number, number]</code> with <code>satisfies</code>, but becomes <code>number[]</code> with an annotation.',
      ],
    },
    {
      heading: 'Interfaces for classes and implements',
      points: [
        'A class implements an interface with the <code>implements</code> keyword: <code>class Dog implements Animal { ... }</code>. TypeScript checks that all required properties and methods are present. A class may implement multiple interfaces.',
        'Interfaces only define the <em>shape</em> — there is no runtime object for an interface. An interface cannot declare private or protected members, only public ones.',
        'When an interface has method signatures, the class provides compatible implementations. The class may add additional methods not listed in the interface.',
        'Using interfaces as injection tokens is a common pattern in Angular and NestJS — you register a class but type the token with the interface, making it easy to substitute a mock in tests.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'interface vs type',
      language: 'typescript',
      code: `// interface — object shapes, declaration-mergeable
interface User {
  id:    number;
  name:  string;
  email: string;
}

// type — any type expression
type StringOrNumber = string | number;
type Callback = (value: string) => void;
type Pair<T> = [T, T];

// Both describe object shapes equally:
interface IPoint { x: number; y: number }
type     TPoint = { x: number; y: number }

const p1: IPoint = { x: 1, y: 2 };
const p2: TPoint = { x: 1, y: 2 };
// Structurally identical — interchangeable here

// type handles what interface cannot:
type Status = 'active' | 'inactive' | 'pending'; // union
type Coords = [number, number];                   // tuple
type Getter = () => string;                       // function`,
    },
    {
      label: 'Extending & Composing',
      language: 'typescript',
      code: `// interface extension
interface Animal { name: string; sound(): string }
interface Dog extends Animal { breed: string }
interface ServiceDog extends Dog { task: string }

const buddy: ServiceDog = {
  name: 'Buddy', sound: () => 'Woof!',
  breed: 'Lab',  task: 'Guide',
};

// Multiple extension
interface Serializable { serialize(): string }
interface Saveable extends Animal, Serializable {
  save(): Promise<void>;
}

// type intersection — same result, different syntax
type AdminUser = User & {
  role:        'admin';
  permissions: string[];
};

// Intersection flattening
type A = { a: string };
type B = { b: number };
type AB = A & B;  // { a: string; b: number }

// Impossible intersection on primitives
type Impossible = string & number;  // never`,
    },
    {
      label: 'Optional, Readonly, Index Signatures',
      language: 'typescript',
      code: `interface Config {
  host:     string;                    // required
  port?:    number;                    // optional
  readonly maxConnections: number;     // cannot be reassigned
}

const cfg: Config = { host: 'localhost', maxConnections: 10 };
cfg.port = 3000;            // ✅ optional can be set later
cfg.maxConnections = 20;    // ❌ Error: readonly

// Index signature — dynamic keys
interface StringMap {
  [key: string]: string;
}
const headers: StringMap = {
  'Content-Type': 'application/json',
  'Accept':       'text/html',
};

// Named properties must match index type
interface Mixed {
  [key: string]: string | number;
  name: string;   // ✅ string assignable to string | number
  // flag: boolean; ❌ not assignable to string | number
}

// Record<K, V> — cleaner index signature
type Env = Record<string, string>;
const env: Env = { NODE_ENV: 'production', PORT: '3000' };`,
    },
    {
      label: 'Declaration Merging',
      language: 'typescript',
      code: `// Two interface declarations with the same name merge
interface Window {
  myPlugin: { version: string };
}
window.myPlugin.version; // ✅ now typed

// Module augmentation — extend a library's types
declare module 'express' {
  interface Request {
    user?: { id: string; role: string };
  }
}
// In any Express handler: req.user is now typed

// type aliases CANNOT merge:
// type Foo = { a: string };
// type Foo = { b: number }; // ❌ Duplicate identifier 'Foo'

// Practical example: build up a global event map
interface DocumentEventMap {
  'app:ready': CustomEvent<{ version: string }>;
}
document.addEventListener('app:ready', e => {
  console.log(e.detail.version); // ✅ typed
});`,
    },
    {
      label: 'keyof, typeof, satisfies',
      language: 'typescript',
      code: `// keyof — union of property name strings
interface User { id: number; name: string; email: string }
type UserKey = keyof User;  // "id" | "name" | "email"

function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user: User = { id: 1, name: 'Alice', email: 'a@b.com' };
getField(user, 'name');   // string
getField(user, 'id');     // number
// getField(user, 'age'); // ❌ not in keyof User

// typeof — extract type from a value
const defaults = { port: 3000, debug: false, host: 'localhost' };
type Config = typeof defaults;
// { port: number; debug: boolean; host: string }

// satisfies — validate without widening (TS 4.9+)
const palette = {
  red:   [255,   0,   0],
  green: [  0, 255,   0],
  blue:  [  0,   0, 255],
} satisfies Record<string, [number, number, number]>;
// palette.red is [number, number, number] — not widened to number[]
// Without satisfies, a type annotation would widen it
palette.red[0]; // ✅ typed as number`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using type when interface would allow merging',
      wrong: `type User = { id: number; name: string };
// Consumers cannot extend:
// type User = User & { role: string }; ❌ cannot redeclare
// interface User { role: string }      ❌ cannot merge with type`,
      right: `interface User { id: number; name: string }
// Consumers can merge in new fields:
interface User { role?: string } // ✅ declaration merging`,
      explanation: 'Use interface for public contracts that consumers may need to extend. type aliases cannot be reopened.',
    },
    {
      title: 'Index signature blocking named property types',
      wrong: `interface Config {
  [key: string]: string;
  port: number; // ❌ number is not assignable to string
}`,
      right: `interface Config {
  [key: string]: string | number;
  port: number;  // ✅ assignable to string | number
  host: string;  // ✅
}`,
      explanation: 'All named properties must be assignable to the index signature value type. Widen the index value to a union that covers all named property types.',
    },
    {
      title: 'Using type annotation instead of satisfies',
      wrong: `const palette: Record<string, number[]> = {
  red: [255, 0, 0],
};
// palette.red is now number[] — lost tuple shape`,
      right: `const palette = {
  red: [255, 0, 0],
} satisfies Record<string, number[]>;
// palette.red is still [number, number, number]`,
      explanation: 'satisfies validates without widening. A type annotation widens the inferred type, losing literal and tuple information.',
    },
    {
      title: 'Forgetting readonly on returned tuples',
      wrong: `function getCoords(): [number, number] {
  return [1, 2];
}
const c = getCoords();
c.push(3); // ✅ compiles — logically wrong`,
      right: `function getCoords(): readonly [number, number] {
  return [1, 2];
}
const c = getCoords();
c.push(3); // ❌ Error: push does not exist on readonly tuple`,
      explanation: 'Mark returned tuples as readonly to prevent callers from mutating them and breaking assumptions.',
    },
    {
      title: 'Confusing implements with structural assignability',
      wrong: `interface Printable { print(): void }
class Report {
  // Missing print() — but no error unless implements is declared
  title = 'My Report';
}
const r: Printable = new Report(); // ❌ Error at use site, not definition`,
      right: `interface Printable { print(): void }
class Report implements Printable {
  print(): void { console.log(this.title); } // ✅ enforced at class
  constructor(private title: string) {}
}`,
      explanation: 'implements documents the intent and catches missing members at the class definition, not at the use site.',
    },
    {
      title: 'Overusing & intersection instead of extends',
      wrong: `type Admin = User & { role: 'admin' };
type SuperAdmin = Admin & { level: number };
// Deep chains become hard to read in tooling hover docs`,
      right: `interface Admin extends User { role: 'admin' }
interface SuperAdmin extends Admin { level: number }
// Explicit hierarchy — shows in IDE hover and error messages`,
      explanation: 'For hierarchical object shapes, interface extends is cleaner and produces better IDE tooltips than deeply nested & intersection chains.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a type-safe plugin registry',
    language: 'typescript',
    description: 'Create a PluginRegistry that stores plugins keyed by name. Each plugin has a name, version, and execute() method. Make the registry generic so that typed plugins can be retrieved by name with full type information preserved — no casts needed at the call site.',
    hints: [
      'Define a Plugin interface: { name: string; version: string; execute(input: unknown): unknown }',
      'Make PluginRegistry generic: class PluginRegistry<TMap extends Record<string, Plugin>>',
      'register<K extends keyof TMap & string>(plugin: TMap[K]): this — use plugin.name as the Map key',
      'get<K extends keyof TMap & string>(name: K): TMap[K] | undefined — cast internally to TMap[K]',
    ],
    starterCode: `interface Plugin {
  name:    string;
  version: string;
  execute(input: unknown): unknown;
}

// TODO: implement PluginRegistry<TMap>

interface LoggerPlugin extends Plugin {
  name: 'logger';
  execute(input: string): void;
  setLevel(level: 'debug' | 'info' | 'warn'): void;
}
interface MetricsPlugin extends Plugin {
  name: 'metrics';
  execute(input: { event: string }): void;
  getCount(): number;
}

type MyPlugins = { logger: LoggerPlugin; metrics: MetricsPlugin };
const registry = new PluginRegistry<MyPlugins>();
// registry.get('logger')?.setLevel('info'); // should be typed`,
    solution: `interface Plugin {
  name:    string;
  version: string;
  execute(input: unknown): unknown;
}

class PluginRegistry<TMap extends Record<string, Plugin>> {
  private plugins = new Map<string, Plugin>();

  register<K extends keyof TMap & string>(plugin: TMap[K]): this {
    this.plugins.set(plugin.name, plugin);
    return this;
  }

  get<K extends keyof TMap & string>(name: K): TMap[K] | undefined {
    return this.plugins.get(name) as TMap[K] | undefined;
  }

  has(name: keyof TMap & string): boolean {
    return this.plugins.has(name);
  }
}

interface LoggerPlugin extends Plugin {
  name: 'logger';
  execute(input: string): void;
  setLevel(level: 'debug' | 'info' | 'warn'): void;
}
interface MetricsPlugin extends Plugin {
  name: 'metrics';
  execute(input: { event: string }): void;
  getCount(): number;
}

type MyPlugins = { logger: LoggerPlugin; metrics: MetricsPlugin };
const registry = new PluginRegistry<MyPlugins>();

const logger = registry.get('logger');   // LoggerPlugin | undefined
logger?.setLevel('info');                // ✅ fully typed — no cast needed`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which statement about interface vs type is TRUE?',
      options: [
        'type can be extended with extends; interface cannot',
        'interface supports declaration merging; type does not',
        'type is preferred for object shapes in all cases',
        'interface can represent union types; type cannot',
      ],
      answer: 1,
      explanation: 'Declaration merging is the key differentiator — two interface declarations with the same name merge automatically. A duplicate type alias is a compile error.',
    },
    {
      q: 'What does `type A = B & C` produce?',
      options: [
        'A type with properties from either B or C (union)',
        'A type with ALL properties from both B and C',
        'A type that is a subset of B',
        'It always equals never',
      ],
      answer: 1,
      explanation: 'The & (intersection) operator creates a type that must satisfy all constraints from both sides — it has every property from both.',
    },
    {
      q: 'An interface has `[key: string]: string` and also `port: number`. What happens?',
      options: [
        'It works — named properties are exempt from index signatures',
        'A compile error — number is not assignable to string',
        'port is automatically widened to string',
        'The index signature is silently ignored',
      ],
      answer: 1,
      explanation: 'All named properties must be assignable to the index signature value type. Fix: widen the index to [key: string]: string | number.',
    },
    {
      q: 'What does `keyof User` return if User is `{ id: number; name: string }`?',
      options: ['User', 'number | string', '"id" | "name"', 'keyof'],
      answer: 2,
      explanation: 'keyof T produces a union of all property name strings (and symbols) of type T. For this User type, it gives "id" | "name".',
    },
    {
      q: 'What is the difference between `satisfies` and a type annotation?',
      options: [
        'satisfies is only available at runtime',
        'A type annotation validates without widening; satisfies widens',
        'satisfies validates without widening; a type annotation widens',
        'They are identical — both validate and widen',
      ],
      answer: 2,
      explanation: 'satisfies checks a value against a type but preserves the narrower inferred type. A type annotation widens the variable to the annotated type, losing literal and tuple information.',
    },
    {
      q: 'Can a class implement multiple interfaces in TypeScript?',
      options: [
        'No — only one interface per class',
        'Yes — class C implements A, B { }',
        'Yes — but only with type aliases, not interface',
        'No — use extends for multiple contracts',
      ],
      answer: 1,
      explanation: 'A class can implement multiple interfaces by listing them comma-separated: class C implements A, B { }. It must satisfy all members of all listed interfaces.',
    },
    {
      q: 'Which syntax extends a type alias (not an interface)?',
      options: [
        'type B extends A = { extra: string }',
        'type B = A & { extra: string }',
        'interface B extends A { extra: string }',
        'type aliases cannot be extended',
      ],
      answer: 1,
      explanation: 'Type aliases are extended via intersection: type B = A & { extra: string }. An interface can also extend a type alias using the extends keyword.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use interface and when type?',
      a: 'Use interface for object shapes that represent contracts — especially for classes (implements), public library APIs, or shapes that consumers might need to extend via declaration merging. Use type for union types, intersection types, mapped types, conditional types, tuples, and any type that cannot be expressed as a plain object shape.',
    },
    {
      q: 'Can a type alias extend an interface?',
      a: 'Yes, via intersection: type Admin = User & { role: "admin" } (where User is an interface). Conversely, interface can extend a type alias: interface Admin extends User { role: "admin" }. The two are fully interoperable.',
    },
    {
      q: 'What is declaration merging and when is it useful?',
      a: 'Declaration merging is when TypeScript combines two interface declarations with the same name into one. It is used to extend third-party types (module augmentation), add properties to global objects like Window, and build large type definitions across multiple files. The standard library relies on it heavily.',
    },
    {
      q: 'Why does my index signature cause errors on named properties?',
      a: 'When you have an index signature [key: string]: T, TypeScript requires all named properties to be assignable to T. If your named property has a type not covered by T, it is a compile error. Fix: widen the index value type to a union that covers all named property types.',
    },
    {
      q: 'What is the difference between readonly and const?',
      a: 'const prevents a variable from being reassigned to a different reference in JavaScript. readonly prevents a property on an object from being reassigned in TypeScript (compile-time only). For deep immutability you need Readonly<T> recursively or Object.freeze() at runtime.',
    },
    {
      q: 'When does satisfies help over a type annotation?',
      a: 'Use satisfies when you want to validate a value against a type but keep the narrower inferred type. For example, palette.red stays inferred as [number, number, number] with satisfies — a type annotation would widen it to number[], losing the tuple length information.',
    },
    {
      q: 'Can two type aliases with the same name be merged?',
      a: 'No. Declaring two type aliases with the same name is a compile error: "Duplicate identifier". Only interface declarations support merging. If you need a type that can be extended or augmented by consumers, prefer interface over type.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'interface and type are largely interchangeable for object shapes — interface wins for merging and implements; type wins for unions, intersections, and computed type expressions.',
    mustKnow: [
      'interface supports declaration merging; type alias cannot be reopened after definition',
      'Both can extend each other: interface B extends AType {} and type B = AInterface & {}',
      'Index signatures ([key: string]: T) require all named properties to be assignable to T',
      'readonly is compile-time only — the underlying JS object remains mutable at runtime',
      'keyof T gives the union of all property name strings; T[K] is the lookup (indexed access) type',
      'satisfies validates without widening; a type annotation validates and widens the inferred type',
      'Module augmentation uses declaration merging to extend third-party interface types',
    ],
    interviewFocus: [
      'What is the difference between interface and type — when would you choose each?',
      'What is declaration merging and how do you use it to extend third-party types?',
      'Why does an index signature cause errors on named properties with different value types?',
      'What does the satisfies operator do differently from a type annotation?',
      'How does keyof T work and what does T[K] (indexed access) give you?',
    ],
  };
}
