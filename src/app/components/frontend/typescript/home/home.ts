import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Type System': 'types', 'Generics': 'generics',
  'Advanced Types': 'advanced', 'OOP': 'oop', 'Tooling': 'tooling', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Type System', 'Generics', 'Advanced Types', 'OOP', 'Tooling', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'TypeScript Fundamentals',    route: '/typescript/basics', badge: 'Foundations', available: true,
    description: 'Why TypeScript, compiling to JS, tsconfig basics, type annotations, and the TypeScript compiler flags.',
    keyPoints: ['TypeScript is a structural type system — shape matters, not name', 'strict: true enables strictNullChecks, noImplicitAny, and more', 'tsc --noEmit: type-check without emitting files (ideal for CI)'] },
  { title: 'Primitive & Literal Types',  route: '/typescript/primitive-types', badge: 'Type System', available: false,
    description: 'string, number, boolean, undefined, null, void, never, unknown, any — and literal types.',
    keyPoints: ['unknown is type-safe any — must narrow before use', 'never: a value that never occurs (exhaustive switch, throwing functions)', 'Literal types: const role = "admin" has type "admin", not string'] },
  { title: 'Interfaces & Type Aliases',  route: '/typescript/interfaces-types', badge: 'Type System', available: false,
    description: 'interface vs type — differences, when to use each, declaration merging, and index signatures.',
    keyPoints: ['Interfaces can be extended and merged; type aliases cannot be reopened', 'type for unions and computed types; interface for object shapes', 'Index signature: [key: string]: T — allows any string key'] },
  { title: 'Union & Intersection Types', route: '/typescript/unions', badge: 'Type System', available: false,
    description: 'Union (|), intersection (&), discriminated unions, and type narrowing techniques.',
    keyPoints: ['Discriminated union: shared literal property narrows the type', 'Narrowing: typeof, instanceof, in, custom type predicates (x is T)', 'Exhaustiveness check: default: satisfies never catches missing cases'] },
  { title: 'Enums & Tuples',             route: '/typescript/enums-tuples', badge: 'Type System', available: false,
    description: 'Const enums, string enums, numeric enums trade-offs, and fixed-length tuple types.',
    keyPoints: ['const enum: erased at compile time — no runtime object generated', 'String enums are more readable in logs than numeric enums', 'Tuple: [string, number] — exact length and positional types'] },
  { title: 'Generics Fundamentals',      route: '/typescript/generics', badge: 'Generics', available: false,
    description: 'Generic functions, generic interfaces, default type parameters, and generic constraints with extends.',
    keyPoints: ['function identity<T>(arg: T): T — T is inferred from call site', 'Constraints: T extends { id: string } limits T to objects with id', 'Default type: Array<T = unknown> provides a fallback when T is omitted'] },
  { title: 'Generic Patterns',           route: '/typescript/generic-patterns', badge: 'Generics', available: false,
    description: 'Generic utility functions, generic classes, and common patterns like Result<T, E> and Option<T>.',
    keyPoints: ['Result<T, E> = { ok: true; value: T } | { ok: false; error: E }', 'Generic factory: function create<T>(ctor: new() => T): T', 'Conditional generic: T extends string ? "yes" : "no"'] },
  { title: 'Utility Types',              route: '/typescript/utility-types', badge: 'Advanced Types', available: false,
    description: 'Partial, Required, Readonly, Pick, Omit, Record, Extract, Exclude, NonNullable, ReturnType, Parameters.',
    keyPoints: ['Partial<T>: all properties optional — useful for update DTOs', 'Record<K, V>: typed object with string/enum keys', 'ReturnType<typeof fn>: extract the return type of any function'] },
  { title: 'Mapped Types',               route: '/typescript/mapped-types', badge: 'Advanced Types', available: false,
    description: 'Transform existing types — iterate over keys with [K in keyof T], modifiers (+/- optional/readonly).',
    keyPoints: ['{ [K in keyof T]: T[K] } is identity mapped type — add modifiers on top', '-? removes optional; -readonly removes readonly', 'Mapped type + conditional type = powerful transformations'] },
  { title: 'Template Literal Types',     route: '/typescript/template-literal-types', badge: 'Advanced Types', available: false,
    description: 'String manipulation at the type level — `${"get" | "set"}${Capitalize<string>}` and infer.',
    keyPoints: ['`${EventName}Changed` generates a union of string literal types', 'Intrinsic string manipulation: Uppercase, Lowercase, Capitalize, Uncapitalize', 'infer in conditional types: extract sub-types from complex types'] },
  { title: 'Conditional Types',          route: '/typescript/conditional-types', badge: 'Advanced Types', available: false,
    description: 'T extends U ? X : Y — distributive conditional types, infer, and deferred resolution.',
    keyPoints: ['Distributive: applied to each member of a union separately', 'infer P in "T extends Promise<infer P>" extracts P from Promise<P>', 'NonNullable<T> = T extends null | undefined ? never : T — stdlib uses this'] },
  { title: 'Decorators',                 route: '/typescript/decorators', badge: 'OOP', available: false,
    description: 'Class, method, property, and parameter decorators — TypeScript 5 decorator syntax (TC39 Stage 3).',
    keyPoints: ['TS 5.0 implements TC39 Stage 3 decorators — breaking change from experimental decorators', 'Class decorator: receives the class, can return a replacement', 'DI frameworks (Angular, NestJS) rely heavily on decorators for metadata'] },
  { title: 'Classes & Visibility',       route: '/typescript/classes', badge: 'OOP', available: false,
    description: 'Access modifiers, abstract classes, readonly, parameter properties, override, and class expressions.',
    keyPoints: ['private is TS-only compile-time; #private is JS runtime-enforced', 'abstract class: cannot be instantiated; forces subclasses to implement methods', 'Parameter property: constructor(private name: string) declares + assigns in one'] },
  { title: 'tsconfig Deep Dive',         route: '/typescript/tsconfig', badge: 'Tooling', available: false,
    description: 'All important compilerOptions — target, lib, module, strict, paths, composite, and project references.',
    keyPoints: ['target: the JS version emitted; lib: type definitions available', 'paths: module aliases; must also be configured in the bundler', 'composite + references: incremental build for monorepos'] },
  { title: 'TypeScript with Frameworks', route: '/typescript/frameworks', badge: 'Tooling', available: false,
    description: 'TypeScript in React (JSX, component props types), Node.js, and Express type-safe request/response.',
    keyPoints: ['React.FC<Props> vs (props: Props) => JSX.Element — prefer the latter', 'Express: augment Request type via declaration merging for req.user', 'Zod: runtime schema + TypeScript type from one declaration (z.infer)'] },
  { title: 'Type Guards & Narrowing',     route: '/typescript/narrowing', badge: 'Type System', available: false,
    description: 'Narrowing techniques in depth — typeof, instanceof, in, user-defined predicates, and assertion functions.',
    keyPoints: ['isXxx(x): x is T — custom type predicate returns boolean + narrows', 'asserts x is T — throws if assertion fails, narrows after call', 'Exhaustiveness check: default: const _: never = x catches missing branches'] },
  { title: 'Declaration Files (d.ts)',    route: '/typescript/declarations', badge: 'Tooling', available: false,
    description: 'Ambient declarations, writing .d.ts files, DefinitelyTyped, and augmenting third-party types.',
    keyPoints: ['declare module "lib" {} — ambient declaration for JS libraries', '@types/xxx packages: community type definitions on DefinitelyTyped', 'Module augmentation: extend existing types with interface merging'] },
  { title: 'Module System & Namespaces', route: '/typescript/modules', badge: 'Tooling', available: false,
    description: 'ES modules vs CommonJS in TS, module resolution algorithms, path aliases, and legacy namespaces.',
    keyPoints: ['moduleResolution: bundler (TS 5), node16, nodenext', 'paths aliases in tsconfig — must mirror bundler config', 'namespace (legacy): use ES modules instead in modern code'] },
  { title: 'Strict Mode & Migration',    route: '/typescript/strict-migration', badge: 'Foundations', available: false,
    description: 'Enabling strict mode step-by-step, migrating JS to TS, and allowJs for gradual adoption.',
    keyPoints: ['strict: true = noImplicitAny + strictNullChecks + more', 'allowJs + checkJs: type-check JS files without migration', 'Incremental migration: add tsconfig + .ts files one module at a time'] },
  { title: 'TypeScript Performance',     route: '/typescript/ts-performance', badge: 'Tooling', available: false,
    description: 'Large project build performance — composite, incremental, isolatedModules, and skipping type-check.',
    keyPoints: ['composite: true + incremental: true for project references build cache', 'isolatedModules: true — each file as separate module, required by esbuild/Babel', 'transpileOnly (ts-node): skip type checks for dev-time speed'] },
  { title: 'TypeScript Cheat Sheet',     route: '/typescript/cheatsheet', badge: 'Reference', available: false,
    description: 'All utility types, key modifiers, generic constraints, and type narrowing patterns at a glance.',
    keyPoints: ['Utility types quick reference: Partial, Required, Pick, Omit, Record, etc.', 'Narrowing cheat sheet: typeof, instanceof, in, discriminant, assertion functions', 'tsconfig flags: strict mode sub-flags explained'] },
  { title: 'TypeScript Interview Prep',  route: '/typescript/interview-prep', badge: 'Reference', available: false,
    description: '35+ TypeScript interview questions — type vs interface, generics, utility types, and advanced patterns.',
    keyPoints: ['What is the difference between type and interface?', 'Explain conditional types and infer', 'How do you ensure exhaustive handling of a discriminated union?'] },
];

@Component({
  selector: 'app-typescript-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class TypeScriptHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
