import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TsSection = 'types' | 'narrowing' | 'generics' | 'utility' | 'mapped' | 'classes' | 'modules' | 'config';

interface CheatEntry { name: string; desc: string; example: string; tag?: string; }

@Component({
  selector: 'app-ts-cheatsheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class TsCheatsheet {
  active = signal<TsSection>('types');
  searchTerm = signal('');

  sections: { key: TsSection; label: string; icon: string }[] = [
    { key: 'types',    label: 'Type System',     icon: '🔷' },
    { key: 'narrowing',label: 'Narrowing',        icon: '🔍' },
    { key: 'generics', label: 'Generics',         icon: '🧬' },
    { key: 'utility',  label: 'Utility Types',   icon: '🛠️' },
    { key: 'mapped',   label: 'Mapped & Cond.',  icon: '🗺️' },
    { key: 'classes',  label: 'Classes',          icon: '🏛️' },
    { key: 'modules',  label: 'Modules',          icon: '📦' },
    { key: 'config',   label: 'tsconfig',         icon: '⚙️' },
  ];

  typesEntries: CheatEntry[] = [
    { name: 'string / number / boolean',  desc: 'Primitive types — the three most common', example: 'const name: string = "Alice";' },
    { name: 'null / undefined',           desc: 'Distinct types — assignable only to themselves (with strictNullChecks)', example: 'let x: string | null = null;' },
    { name: 'unknown',                    desc: 'Type-safe any — must narrow before use', example: 'function parse(v: unknown) { if (typeof v === "string") v.toUpperCase(); }' },
    { name: 'never',                      desc: 'A value that never occurs — thrown functions, exhaustive checks', example: 'function fail(msg: string): never { throw new Error(msg); }' },
    { name: 'any',                        desc: 'Opt out of type-checking — avoid; prefer unknown at boundaries', example: 'let x: any = 42; x.nonexistent(); // no error' },
    { name: 'void',                       desc: 'Return type for functions that return no useful value', example: 'function log(msg: string): void { console.log(msg); }' },
    { name: 'literal type',              desc: 'Exact value as a type — common with as const and unions', example: 'type Direction = "up" | "down" | "left" | "right";' },
    { name: 'union |',                   desc: 'Either type A or type B', example: 'type ID = string | number;' },
    { name: 'intersection &',            desc: 'Both type A and type B — combined shape', example: 'type Admin = User & { permissions: string[] };' },
    { name: 'tuple',                     desc: 'Fixed-length array with positional types', example: 'const point: [number, number] = [10, 20];' },
    { name: 'labeled tuple',             desc: 'Tuple with named positions — better errors and docs', example: 'type Range = [start: number, end: number];' },
    { name: 'as const',                  desc: 'Narrow literals to their exact type; objects become readonly', example: 'const DIRS = ["up", "down"] as const; // readonly ["up","down"]' },
    { name: 'satisfies',                 desc: 'Check value matches a type without widening — preserves narrower type', example: 'const cfg = { port: 3000 } satisfies Partial<Config>;', tag: 'TS 4.9' },
    { name: 'type assertion as',         desc: 'Compile-time override — no runtime effect. Use sparingly', example: 'const el = document.getElementById("app") as HTMLDivElement;' },
    { name: 'non-null assertion !',      desc: 'Assert value is not null/undefined — TypeScript trusts you', example: 'const el = document.getElementById("app")!;' },
    { name: 'interface',                 desc: 'Named object shape — supports extension and declaration merging', example: 'interface User { id: string; name: string; age?: number; }' },
    { name: 'type alias',                desc: 'Name for any type — unions, intersections, primitives, tuples', example: 'type Callback<T> = (value: T) => void;' },
    { name: 'interface vs type',         desc: 'interface: extends, merges. type: unions, computed types, primitives', example: 'interface Animal { name: string } // extendable\ntype Pet = Animal & { owner: string }' },
    { name: 'index signature',           desc: 'Allow any string key with a specified value type', example: 'interface Dict { [key: string]: string; }' },
    { name: 'readonly',                  desc: 'Property or array that cannot be reassigned after creation', example: 'interface Config { readonly port: number; }\nconst arr: readonly number[] = [1,2,3];' },
    { name: 'optional property ?',       desc: 'Property may be absent — type is T | undefined when accessed', example: 'interface Opts { timeout?: number; }' },
    { name: 'function type',             desc: 'Type for a callable — arrow syntax in types', example: 'type Predicate<T> = (value: T) => boolean;' },
    { name: 'enum',                      desc: 'Named set of constants — numeric by default', example: 'enum Direction { Up, Down, Left, Right }' },
    { name: 'const enum',               desc: 'Inlined at compile time — no runtime object generated', example: 'const enum Status { Active = "active", Inactive = "inactive" }' },
    { name: 'keyof',                     desc: 'Union of all keys of a type', example: 'type UserKeys = keyof User; // "id" | "name" | "age"' },
    { name: 'typeof',                    desc: 'Type of a value — use at type level for inference', example: 'const config = { port: 3000 };\ntype Config = typeof config; // { port: number }' },
    { name: 'indexed access T[K]',       desc: 'Type of a property — picks the value type by key', example: 'type Port = Config["port"]; // number' },
    { name: 'template literal type',     desc: 'String types built by concatenation', example: 'type EventName = `on${Capitalize<"click" | "blur">}`; // "onClick" | "onBlur"' },
  ];

  narrowingEntries: CheatEntry[] = [
    { name: 'typeof guard',             desc: 'Narrow primitive types', example: 'if (typeof x === "string") x.toUpperCase();' },
    { name: 'instanceof guard',         desc: 'Narrow class instances', example: 'if (error instanceof TypeError) error.message;' },
    { name: 'in guard',                 desc: 'Narrow by property existence', example: 'if ("name" in obj) obj.name; // obj has name' },
    { name: 'equality narrowing',       desc: 'Narrow by === or !== check', example: 'if (x === null) return; // x is not null after' },
    { name: 'truthiness narrowing',     desc: 'Narrow falsy types (null, undefined, "", 0) with if(!x)', example: 'if (!value) return; // value is not null/undefined/""/"0"' },
    { name: 'type predicate x is T',   desc: 'Custom type guard — returns boolean, narrows on true', example: 'function isUser(v: unknown): v is User {\n  return typeof v === "object" && v !== null && "id" in v;\n}' },
    { name: 'assertion function',       desc: 'asserts x is T — throws on false, narrows after call', example: 'function assertString(v: unknown): asserts v is string {\n  if (typeof v !== "string") throw new Error("not a string");\n}' },
    { name: 'discriminated union',      desc: 'Shared literal property narrows to correct variant', example: 'type Shape =\n  | { kind: "circle"; radius: number }\n  | { kind: "square"; side: number };\nif (shape.kind === "circle") shape.radius;' },
    { name: 'exhaustiveness check',     desc: 'Catch missing cases — assign to never in default branch', example: 'function area(shape: Shape): number {\n  switch (shape.kind) {\n    case "circle": return Math.PI * shape.radius ** 2;\n    case "square": return shape.side ** 2;\n    default: const _: never = shape; throw new Error("unhandled");\n  }\n}' },
    { name: 'optional chaining ?.',     desc: 'Short-circuit if null/undefined — returns undefined', example: 'const city = user?.address?.city;' },
    { name: 'nullish coalescing ??',    desc: 'Fallback only for null/undefined (not 0 or "")', example: 'const timeout = opts?.timeout ?? 5000;' },
    { name: 'non-null assertion !',     desc: 'Assert non-null — no runtime check, TypeScript trusts you', example: 'const el = document.getElementById("app")!.style;' },
    { name: 'satisfies operator',       desc: 'Validate shape without widening — keeps narrower inferred type', example: 'const palette = { red: [255,0,0] } satisfies Record<string, [number,number,number]>;', tag: 'TS 4.9' },
  ];

  genericsEntries: CheatEntry[] = [
    { name: 'generic function',         desc: 'T is inferred from the call site argument', example: 'function identity<T>(value: T): T { return value; }' },
    { name: 'generic constraint',       desc: 'T extends X limits T to shapes that include X', example: 'function getLength<T extends { length: number }>(v: T): number { return v.length; }' },
    { name: 'default type parameter',   desc: 'Use a fallback when T is not provided', example: 'interface Box<T = string> { value: T; }' },
    { name: 'multiple type params',     desc: 'Declare more than one independently inferred type', example: 'function zip<A, B>(a: A[], b: B[]): [A, B][] { return a.map((v, i) => [v, b[i]]); }' },
    { name: 'generic interface',        desc: 'Interface parameterized over a type', example: 'interface Repository<T> { findById(id: string): Promise<T>; save(entity: T): Promise<void>; }' },
    { name: 'generic class',            desc: 'Class parameterized over a type', example: 'class Stack<T> { #items: T[] = []; push(v: T) { this.#items.push(v); } pop(): T | undefined { return this.#items.pop(); } }' },
    { name: 'conditional generic',      desc: 'T extends U ? X : Y — distribute over unions by default', example: 'type IsArray<T> = T extends unknown[] ? true : false;' },
    { name: 'infer',                    desc: 'Extract a type from within a conditional type', example: 'type Unwrap<T> = T extends Promise<infer U> ? U : T;' },
    { name: 'Awaited<T>',              desc: 'Unwrap nested Promise types — built-in since TS 4.5', example: 'type Data = Awaited<Promise<Promise<string>>>; // string', tag: 'TS 4.5' },
    { name: 'ReturnType<F>',            desc: 'Extract the return type of a function type', example: 'type R = ReturnType<typeof fetch>; // Promise<Response>' },
    { name: 'Parameters<F>',            desc: 'Extract function parameters as a tuple', example: 'type P = Parameters<typeof parseInt>; // [string, number?]' },
    { name: 'InstanceType<C>',          desc: 'Extract the instance type from a constructor', example: 'type M = InstanceType<typeof Map>; // Map<unknown,unknown>' },
    { name: 'constructor type',         desc: 'Type for a class constructor — used in mixin patterns', example: 'type Constructor<T = {}> = new (...args: any[]) => T;' },
    { name: 'variadic tuple types',     desc: 'Spread generics into tuple positions', example: 'type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];', tag: 'TS 4.0' },
  ];

  utilityEntries: CheatEntry[] = [
    { name: 'Partial<T>',              desc: 'All properties of T become optional — shallow only', example: 'type UpdateUser = Partial<User>;' },
    { name: 'Required<T>',             desc: 'All optional properties become required', example: 'type FullConfig = Required<Partial<Config>>;' },
    { name: 'Readonly<T>',             desc: 'All properties become readonly — shallow only', example: 'type FrozenUser = Readonly<User>;' },
    { name: 'Pick<T, K>',              desc: 'Keep only specified keys from T', example: 'type Preview = Pick<User, "id" | "name">;' },
    { name: 'Omit<T, K>',             desc: 'Remove specified keys from T — complement of Pick', example: 'type PublicUser = Omit<User, "password" | "salt">;' },
    { name: 'Record<K, V>',            desc: 'Object type with keys of type K and values of type V', example: 'type RoleMap = Record<"admin" | "user", string[]>;' },
    { name: 'Extract<T, U>',           desc: 'Keep union members assignable to U', example: 'type Strings = Extract<string | number | boolean, string>; // string' },
    { name: 'Exclude<T, U>',           desc: 'Remove union members assignable to U', example: 'type NonNull<T> = Exclude<T, null | undefined>;' },
    { name: 'NonNullable<T>',          desc: 'Remove null and undefined from T', example: 'type Name = NonNullable<string | null | undefined>; // string' },
    { name: 'ReturnType<T>',           desc: 'Return type of a function type T', example: 'type Res = ReturnType<() => Promise<User>>; // Promise<User>' },
    { name: 'Parameters<T>',           desc: 'Parameter types of a function type as a tuple', example: 'type Args = Parameters<(a: string, b: number) => void>; // [string, number]' },
    { name: 'ConstructorParameters<T>',desc: 'Constructor parameter types as a tuple', example: 'type Args = ConstructorParameters<typeof Date>; // [string | number | Date]' },
    { name: 'InstanceType<T>',         desc: 'Instance type of a constructor type T', example: 'type M = InstanceType<typeof Map>; // Map<any, any>' },
    { name: 'Awaited<T>',              desc: 'Recursively unwrap Promise types', example: 'type D = Awaited<Promise<Promise<string>>>; // string', tag: 'TS 4.5' },
    { name: 'Uppercase<S>',            desc: 'Uppercase all characters of a string literal type', example: 'type U = Uppercase<"hello">; // "HELLO"' },
    { name: 'Lowercase<S>',            desc: 'Lowercase all characters', example: 'type L = Lowercase<"HELLO">; // "hello"' },
    { name: 'Capitalize<S>',           desc: 'Uppercase the first character', example: 'type C = Capitalize<"hello">; // "Hello"' },
    { name: 'Uncapitalize<S>',         desc: 'Lowercase the first character', example: 'type U = Uncapitalize<"Hello">; // "hello"' },
  ];

  mappedEntries: CheatEntry[] = [
    { name: '[K in keyof T]',           desc: 'Iterate over all keys of T — identity mapped type', example: 'type Copy<T> = { [K in keyof T]: T[K] };' },
    { name: '-? modifier',              desc: 'Remove optional — make all properties required', example: 'type Required<T> = { [K in keyof T]-?: T[K] };' },
    { name: '-readonly modifier',       desc: 'Remove readonly — make all properties mutable', example: 'type Mutable<T> = { -readonly [K in keyof T]: T[K] };' },
    { name: 'key remapping as',         desc: 'Rename keys in a mapped type', example: 'type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };' },
    { name: 'as never filtering',       desc: 'Remove keys by remapping to never', example: 'type OnlyStrings<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] };' },
    { name: 'T extends U ? X : Y',     desc: 'Conditional type — distributes over unions by default', example: 'type IsString<T> = T extends string ? true : false;' },
    { name: '[T] extends [U]',          desc: 'Non-distributive conditional — wrapping in tuple disables distribution', example: 'type IsNever<T> = [T] extends [never] ? true : false;' },
    { name: 'infer in conditional',     desc: 'Extract a type from within the extends clause', example: 'type UnwrapArray<T> = T extends Array<infer Item> ? Item : T;' },
    { name: 'distributive over union',  desc: 'T extends U distributes: (A | B) extends U → (A extends U) | (B extends U)', example: 'type ToArray<T> = T extends unknown ? T[] : never;\ntype R = ToArray<string | number>; // string[] | number[]' },
    { name: 'homomorphic mapped type',  desc: 'Mapped type that uses keyof T — preserves optional and readonly modifiers', example: 'type Optional<T> = { [K in keyof T]?: T[K] }; // preserves readonly' },
    { name: 'UnionToIntersection<U>',  desc: 'Convert union to intersection via contravariant inference', example: 'type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;' },
    { name: 'DeepReadonly<T>',          desc: 'Recursively make all properties readonly', example: 'type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };' },
    { name: 'discriminated union check',desc: 'Use never in default: to catch unhandled variants at compile time', example: 'const _: never = shape; // in default: branch' },
    { name: 'Flatten<T>',              desc: 'Unwrap one level of array nesting', example: 'type Flatten<T> = T extends Array<infer Item> ? Item : T;' },
  ];

  classesEntries: CheatEntry[] = [
    { name: 'public / private / protected', desc: 'Access modifiers — public: everywhere, private: class only, protected: class+subclasses', example: 'class Foo { public a = 1; private b = 2; protected c = 3; }' },
    { name: '# private field',             desc: 'JavaScript runtime-private field — truly inaccessible outside class', example: 'class Foo { #secret = 42; get() { return this.#secret; } }' },
    { name: 'readonly',                    desc: 'Property or parameter that cannot be reassigned after construction', example: 'class Config { constructor(readonly port: number) {} }' },
    { name: 'parameter property',          desc: 'Declare + assign in constructor shorthand', example: 'class User { constructor(public name: string, private age: number) {} }' },
    { name: 'abstract class',             desc: 'Cannot be instantiated — forces subclasses to implement abstract members', example: 'abstract class Shape { abstract area(): number; }' },
    { name: 'override',                   desc: 'Explicitly mark a method as overriding a base class method — error if base method removed', example: 'class Circle extends Shape { override area() { return Math.PI * this.r ** 2; } }', tag: 'TS 4.3' },
    { name: 'static member',              desc: 'Belongs to the class constructor, not instances', example: 'class Counter { static count = 0; static increment() { this.count++; } }' },
    { name: 'accessor keyword',            desc: 'Auto-accessor — backing field + getter/setter pair (TC39 Stage 3)', example: 'class Person { accessor name: string = ""; }', tag: 'TS 4.9' },
    { name: 'implements',                 desc: 'Declare a class conforms to an interface — structural check only', example: 'class Dog implements Animal { name = "Rex"; speak() { return "woof"; } }' },
    { name: 'mixin pattern',              desc: 'Extend multiple behaviors via factory functions over constructor type', example: 'type Ctor<T={}> = new (...a: any[]) => T;\nfunction Serializable<B extends Ctor>(Base: B) { return class extends Base { serialize() { return JSON.stringify(this); } }; }' },
    { name: 'class expression',           desc: 'Anonymous or named class as an expression — assignable to a variable', example: 'const Animal = class<T> { constructor(public value: T) {} };' },
    { name: 'declare class',              desc: 'Ambient class declaration — declares types for an existing JS class', example: 'declare class EventEmitter { on(event: string, fn: Function): this; }' },
  ];

  modulesEntries: CheatEntry[] = [
    { name: 'named export',              desc: 'Export specific identifiers — preferred, explicit, refactor-friendly', example: 'export const PI = 3.14;\nexport function add(a: number, b: number) { return a + b; }' },
    { name: 'default export',            desc: 'One per file — import without braces, name chosen by consumer', example: 'export default class UserService { /* ... */ }' },
    { name: 'import type',              desc: 'Type-only import — erased from emitted JS, required with isolatedModules', example: 'import type { User } from "./user";' },
    { name: 'inline type import',        desc: 'Mix value and type imports from one module', example: 'import { createUser, type User } from "./user";' },
    { name: 're-export',                desc: 'Re-export from another module without importing into current scope', example: 'export { parseDate } from "./dates";\nexport type { DateOptions } from "./dates";' },
    { name: 'barrel / index.ts',         desc: 'Re-export folder\'s public API — clean imports, careful with large barrels', example: 'export * from "./dates";\nexport * from "./strings";' },
    { name: 'namespace import',          desc: 'Import all exports as a namespace object', example: 'import * as math from "./math";\nmath.add(1, 2);' },
    { name: 'dynamic import()',          desc: 'Lazy load a module at runtime — returns a Promise<Module>', example: 'const { add } = await import("./math");' },
    { name: 'declare module',           desc: 'Ambient module — types for a JS-only library or wildcard asset imports', example: 'declare module "*.svg" { const url: string; export default url; }' },
    { name: 'module augmentation',       desc: 'Add types to an existing module — import first to augment (not replace)', example: 'import "express";\ndeclare module "express" { interface Request { user?: User; } }' },
    { name: 'declare global',           desc: 'Add to global scope — must be in a module file (has import/export)', example: 'export {};\ndeclare global { interface Window { analytics: Analytics; } }' },
    { name: 'import.meta',             desc: 'ESM metadata: .url (Node.js), .env (Vite), .hot (Vite HMR)', example: 'const apiUrl = import.meta.env.VITE_API_URL;' },
  ];

  configEntries: CheatEntry[] = [
    { name: 'target',                   desc: 'JS version emitted — affects which syntax features are down-compiled', example: '"target": "ES2022"' },
    { name: 'lib',                      desc: 'Type definitions available — independent of target', example: '"lib": ["ES2022", "DOM", "DOM.Iterable"]' },
    { name: 'module',                   desc: 'Output module format — ESNext for bundlers, NodeNext for Node.js ESM', example: '"module": "ESNext"' },
    { name: 'moduleResolution',         desc: '"bundler" for Vite/esbuild, "node16" for native Node.js ESM', example: '"moduleResolution": "bundler"' },
    { name: 'strict',                   desc: 'Enables 8 flags: strictNullChecks, noImplicitAny, and 6 others', example: '"strict": true' },
    { name: 'noEmit',                   desc: 'Type-check only — no JS files written. Use when bundler handles emit', example: '"noEmit": true' },
    { name: 'incremental',              desc: 'Write .tsbuildinfo cache — subsequent builds skip unchanged files', example: '"incremental": true, "tsBuildInfoFile": ".cache/.tsbuildinfo"' },
    { name: 'composite',               desc: 'Enable project references for monorepos — requires declaration: true', example: '"composite": true, "declaration": true, "declarationMap": true' },
    { name: 'isolatedModules',          desc: 'Each file is standalone — required by Vite, esbuild, SWC, Babel', example: '"isolatedModules": true' },
    { name: 'paths',                    desc: 'Module aliases — type-only! Also configure the same in your bundler', example: '"paths": { "@app/*": ["./src/app/*"] }' },
    { name: 'declaration',             desc: 'Emit .d.ts files — required when publishing a library', example: '"declaration": true, "declarationMap": true' },
    { name: 'skipLibCheck',             desc: 'Skip type-checking .d.ts files — speeds up builds, hides third-party errors', example: '"skipLibCheck": true' },
    { name: 'noUncheckedIndexedAccess', desc: 'arr[0] returns T | undefined — more accurate, not in strict', example: '"noUncheckedIndexedAccess": true' },
    { name: 'exactOptionalPropertyTypes', desc: 'optional props can\'t be set to undefined explicitly — must omit the key', example: '"exactOptionalPropertyTypes": true' },
    { name: 'esModuleInterop',          desc: 'Allow CJS default imports: import fs from "fs" — needed for many npm packages', example: '"esModuleInterop": true' },
    { name: 'allowJs / checkJs',       desc: 'Include .js files in compilation; checkJs type-checks them via JSDoc', example: '"allowJs": true, "checkJs": true' },
    { name: 'types',                   desc: 'Limit @types packages auto-included — prevents conflicts', example: '"types": ["node", "jest"]' },
    { name: 'tsc --extendedDiagnostics', desc: 'Show timing per compilation phase — diagnose slow builds', example: 'npx tsc --noEmit --extendedDiagnostics' },
  ];

  get currentEntries(): CheatEntry[] {
    const map: Record<TsSection, CheatEntry[]> = {
      types:    this.typesEntries,
      narrowing:this.narrowingEntries,
      generics: this.genericsEntries,
      utility:  this.utilityEntries,
      mapped:   this.mappedEntries,
      classes:  this.classesEntries,
      modules:  this.modulesEntries,
      config:   this.configEntries,
    };
    return map[this.active()];
  }

  filteredEntries = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.currentEntries;
    return this.currentEntries.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.desc.toLowerCase().includes(term) ||
      e.example.toLowerCase().includes(term)
    );
  });

  setSection(key: TsSection) {
    this.active.set(key);
    this.searchTerm.set('');
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }
}
