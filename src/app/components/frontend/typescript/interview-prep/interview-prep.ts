import { Component, signal, computed } from '@angular/core';

export interface InterviewQuestion {
  q: string;
  a: string;
  topic: string;
  level: 'junior' | 'mid' | 'senior';
}

const QUESTIONS: InterviewQuestion[] = [
  // ── Type System ─────────────────────────────────────────────────────────────
  {
    q: 'What is the difference between type and interface in TypeScript?',
    a: 'Both describe object shapes, but they differ in extensibility and capabilities. interface supports declaration merging — two interface Foo declarations in different files combine into one. type aliases cannot be reopened or merged. interface uses extends for inheritance; type uses & intersection. Use interface for object shapes that may need augmentation (e.g. library extension points). Use type for unions, intersections, computed types, and primitives — anything interface cannot express.',
    topic: 'Type System',
    level: 'junior',
  },
  {
    q: 'What is the difference between unknown and any?',
    a: 'Both accept any value, but they differ in how you can use them. any completely disables type-checking — you can call methods, access properties, and assign to anything without error. unknown is the type-safe counterpart — you must narrow it (typeof, instanceof, a type guard, or an assertion) before you can use it. Use unknown at system boundaries (API responses, JSON.parse results, error catch blocks) and avoid any except as a last resort during migrations.',
    topic: 'Type System',
    level: 'junior',
  },
  {
    q: 'What is a discriminated union and what problem does it solve?',
    a: 'A discriminated union is a union of object types that share a literal property (the discriminant) with distinct values per variant. When you check the discriminant, TypeScript narrows the type to the matching variant, giving you full type-safety without type assertions. Example: type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number }. After if (shape.kind === "circle"), TypeScript knows radius exists. This pattern cleanly models state machines, API responses, and polymorphic data.',
    topic: 'Type System',
    level: 'junior',
  },
  {
    q: 'What is structural typing and how does it differ from nominal typing?',
    a: 'TypeScript uses structural typing — a type is compatible if it has the required shape, regardless of its name or declaration origin. If type A has all properties of type B, then A is assignable to B even if they are declared separately. This is called "duck typing" at the type level. Most other typed languages (Java, C#, Swift) use nominal typing — types are compatible only if they share an explicit inheritance or implementation relationship. TypeScript\'s structural system means you can pass any object with the right shape to a function without declaring that it implements an interface.',
    topic: 'Type System',
    level: 'junior',
  },
  {
    q: 'What does `strict: true` enable?',
    a: 'strict: true is shorthand for eight compiler flags: strictNullChecks (null/undefined are not assignable to other types), noImplicitAny (unannotated parameters are an error), strictFunctionTypes (function parameter contravariance), strictBindCallApply (typed bind/call/apply), strictPropertyInitialization (class fields must be initialized), strictBuiltinIteratorReturn, noImplicitThis, and alwaysStrict ("use strict" in every file). The most impactful are strictNullChecks (catches null access bugs) and noImplicitAny (forces explicit annotations). noUncheckedIndexedAccess and exactOptionalPropertyTypes are additional flags not included in strict.',
    topic: 'Type System',
    level: 'junior',
  },
  {
    q: 'What is the `never` type and when does it arise?',
    a: 'never represents a value that can never occur. It arises in: (1) functions that always throw or infinite-loop (their return type is never); (2) exhaustive type narrowing — after checking all union variants, the remaining type is never; (3) conditional types where no branch matches. never is the bottom type — it is assignable to every type, but nothing is assignable to never. The exhaustiveness pattern uses this: const _: never = unhandledCase — if a new union variant is added without handling, TypeScript errors here.',
    topic: 'Type System',
    level: 'mid',
  },
  {
    q: 'What is the `satisfies` operator and how is it different from a type annotation?',
    a: 'satisfies (TypeScript 4.9) validates that a value matches a type without widening the inferred type. With const x: Palette = { red: [255,0,0] }, TypeScript widens red to number[]. With const x = { red: [255,0,0] } satisfies Palette, TypeScript validates the shape but keeps the narrower inferred type [number, number, number] — so x.red still has tuple methods like .length === 3. Use satisfies when you want type-safety without losing precision from explicit annotation.',
    topic: 'Type System',
    level: 'mid',
  },
  {
    q: 'Explain type widening and how to prevent it.',
    a: 'TypeScript widens types by default: const x = "hello" infers string, not the literal "hello". let x = "hello" also infers string. Widening prevents you from using narrower types where you need them. To prevent widening: (1) use as const — const dir = "up" as const infers the literal "up". (2) annotate explicitly: const dir: "up" = "up". (3) for objects: const config = { port: 3000 } as const infers { readonly port: 3000 }. Widening is intentional for flexibility; suppress it when you need the exact literal type.',
    topic: 'Type System',
    level: 'mid',
  },

  // ── Generics ────────────────────────────────────────────────────────────────
  {
    q: 'How do generic constraints work in TypeScript?',
    a: 'Constraints limit what types T can be. function getLength<T extends { length: number }>(v: T): number restricts T to any type with a length property. You can constrain to: specific shapes (extends { id: string }), other type parameters (K extends keyof T), primitive types (T extends string | number), or constructor types (T extends new(...args) => U). Without constraints, T is unknown inside the function body — you cannot access any properties. Constraints give the function body information about T while keeping the callsite flexible.',
    topic: 'Generics',
    level: 'junior',
  },
  {
    q: 'What is the difference between Omit and Exclude?',
    a: 'They operate on different kinds of types. Omit<T, K> removes keys from an object type: Omit<User, "password"> gives you User without the password property. Exclude<T, U> removes members from a union type: Exclude<string | number | boolean, string> gives number | boolean. A common mistake is using Omit on a union (it does not distribute — use DistributiveOmit<T, K> = T extends any ? Omit<T, K> : never instead) or using Exclude to remove object properties (it only filters union members).',
    topic: 'Generics',
    level: 'mid',
  },
  {
    q: 'What does `infer` do in TypeScript conditional types?',
    a: 'infer introduces a type variable within the extends clause of a conditional type, capturing a portion of the matched type. type UnwrapPromise<T> = T extends Promise<infer U> ? U : T — here infer U captures whatever Promise wraps. infer is only valid inside a conditional type\'s extends clause. It enables extracting: array element types (T extends Array<infer Item>), function return types (T extends (...args: any) => infer R), tuple elements, and deeply nested types. The built-in ReturnType, Parameters, and Awaited utilities all use infer internally.',
    topic: 'Generics',
    level: 'mid',
  },
  {
    q: 'What are distributive conditional types and how do you disable distribution?',
    a: 'When a conditional type is applied to a naked type parameter T (bare, not wrapped), TypeScript distributes over union members: type ToArray<T> = T extends unknown ? T[] : never; applied to string | number gives string[] | number[] (not (string | number)[]). To disable distribution, wrap T in a tuple: type IsString<T> = [T] extends [string] ? true : false. With [T] extends [never] you get the correct IsNever check — plain T extends never distributes over the empty union and always returns never. Distributive behavior is usually desirable but can surprise you with IsNever or NoDistribute scenarios.',
    topic: 'Generics',
    level: 'senior',
  },

  // ── Narrowing & Type Guards ──────────────────────────────────────────────────
  {
    q: 'What is a type predicate and when would you write one?',
    a: 'A type predicate is a function return type of the form x is T. function isUser(v: unknown): v is User { ... } returns a boolean, but TypeScript treats true as "v is User" in the calling scope. Write one when: (1) you need to narrow an unknown or union type that typeof/instanceof cannot handle; (2) you are filtering arrays — arr.filter((x): x is User => isUser(x)) gives User[] not (User | null)[]; (3) you wrap complex narrowing logic that would be repeated at call sites. Assertion functions (asserts x is T) throw on failure instead of returning false — use for precondition checks.',
    topic: 'Narrowing',
    level: 'mid',
  },
  {
    q: 'How does exhaustiveness checking work with discriminated unions?',
    a: 'Add a default branch that assigns to never: default: const _: never = value; throw new Error("Unhandled variant"). If all union variants are handled above, the default is never reached — TypeScript knows value is never there, so the assignment is valid. If you add a new variant to the union without handling it, TypeScript errors: "Type \'NewVariant\' is not assignable to type \'never\'." This catches missing cases at compile time. An alternative is the assertNever(x: never) helper function — same principle, usable in expressions.',
    topic: 'Narrowing',
    level: 'mid',
  },
  {
    q: 'What is the difference between optional chaining (?.) and the nullish coalescing operator (??)?',
    a: 'They solve related but distinct problems. Optional chaining (?.) short-circuits property access and method calls when the left side is null or undefined: user?.address?.city returns undefined instead of throwing. Nullish coalescing (??) provides a default value when the left side is null or undefined: timeout ?? 5000. The key distinction from || is that ?? only triggers for null/undefined — 0 and "" pass through. Combining them: user?.preferences?.timeout ?? 5000 is a common pattern for safely reading optional config with a fallback.',
    topic: 'Narrowing',
    level: 'junior',
  },

  // ── Mapped & Conditional Types ───────────────────────────────────────────────
  {
    q: 'What is a mapped type and how does the -? modifier work?',
    a: 'A mapped type creates a new type by iterating over keys of another: type Copy<T> = { [K in keyof T]: T[K] } is the identity mapped type. You can add modifiers: ? makes properties optional, readonly makes them readonly. The - prefix removes modifiers: -? removes optional (makes required), -readonly removes readonly. TypeScript\'s built-in Required<T> is implemented as { [K in keyof T]-?: T[K] }. Homomorphic mapped types (using keyof T) preserve the original optional and readonly modifiers of the source type unless you override them.',
    topic: 'Advanced Types',
    level: 'mid',
  },
  {
    q: 'How does key remapping with `as` work in mapped types?',
    a: 'The as clause in a mapped type renames keys. type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] } transforms each key K into a getter name. The string & K intersection is necessary because keyof T can include symbol and number keys, which Capitalize does not accept. Remapping to never filters keys: type OnlyStrings<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] } removes properties whose values are not strings. This pattern is how you build conditional, filtered, or renamed types from existing ones.',
    topic: 'Advanced Types',
    level: 'senior',
  },
  {
    q: 'Why does `IsNever<T> = T extends never ? true : false` not work correctly?',
    a: 'When T is a naked type parameter and equals never, the conditional type distributes over the empty union (never is an empty union). Distribution over empty union means no branch runs — the result is never, not true. To correctly detect never, wrap T in a tuple to disable distribution: type IsNever<T> = [T] extends [never] ? true : false. With [T], you are checking whether the tuple [T] extends [never] — this is not a naked generic application, so distribution is disabled and the check works correctly.',
    topic: 'Advanced Types',
    level: 'senior',
  },
  {
    q: 'What is the difference between `Partial<T>` and a deep partial type?',
    a: 'Partial<T> is shallow — it only makes top-level properties optional. Nested object properties remain required. type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] } recursively applies the optional modifier. TypeScript does not include DeepPartial as a built-in because it is expensive to compute for deeply nested types and can slow the language server. When you need deep partial for config updates, either implement it with a depth limit or use a library like ts-essentials which provides well-bounded versions.',
    topic: 'Advanced Types',
    level: 'mid',
  },

  // ── Classes & OOP ────────────────────────────────────────────────────────────
  {
    q: 'What is the difference between TypeScript `private` and JavaScript `#` private fields?',
    a: 'TypeScript private is compile-time only — it prevents access in TypeScript code but has no effect in the emitted JavaScript. At runtime, the property is accessible via any JavaScript code or reflection. JavaScript # private fields (class fields proposal, now standard) are runtime-enforced — the property is truly inaccessible outside the class at runtime, even through Object.keys or type assertions. TypeScript models both, but # fields provide actual encapsulation. Use # when you need runtime privacy guarantees; use TypeScript private for compile-time enforcement only.',
    topic: 'Classes',
    level: 'mid',
  },
  {
    q: 'What does the `override` keyword do and why is it useful?',
    a: 'override (TypeScript 4.3) explicitly marks a method as overriding a base class method. If the base class later renames or removes that method, TypeScript errors: "This member cannot have an \'override\' modifier because it is not declared in the base class." Without override, renaming a base class method silently makes the subclass method an unrelated new method — a common refactoring bug. Enable noImplicitOverride: true in tsconfig to require override on all inherited method overrides, making the contract explicit.',
    topic: 'Classes',
    level: 'mid',
  },
  {
    q: 'What is the mixin pattern in TypeScript and why is it needed?',
    a: 'TypeScript (and JavaScript) do not support multiple class inheritance. Mixins are a workaround: factory functions that take a base class and return an extended version. type Constructor<T = {}> = new (...args: any[]) => T; function Serializable<B extends Constructor>(Base: B) { return class extends Base { serialize() { return JSON.stringify(this); } }; } Compose mixins: class MyModel extends Serializable(Timestamped(BaseModel)) {}. The resulting class has all the behaviors. The constraint on B ensures the mixin extends a proper class constructor, not an arbitrary object.',
    topic: 'Classes',
    level: 'senior',
  },

  // ── Modules & Declarations ───────────────────────────────────────────────────
  {
    q: 'What does `import type` do and when is it required?',
    a: 'import type { Foo } from "./foo" is a type-only import — it is completely erased from the emitted JavaScript. No require() call, no import statement. This eliminates circular runtime dependencies that exist only because of type annotations. With isolatedModules: true (required by Vite, esbuild, Babel), TypeScript enforces that imports used only as types use the type modifier. You can also mix: import { type Foo, createFoo } from "./foo" — type keyword on individual specifiers in a regular import.',
    topic: 'Modules',
    level: 'mid',
  },
  {
    q: 'How do you add custom properties to the Express Request type?',
    a: 'Use module augmentation. Create a .d.ts file (e.g. src/types/express.d.ts) with: import "express"; declare module "express" { interface Request { user?: { id: string; email: string }; } }. The import "express" line is critical — without it, the declare module replaces all Express types instead of augmenting them. Place the file in a directory covered by tsconfig include. Now req.user is typed in every route handler. Never put augmentations inside middleware .ts files — they only apply when that file is imported.',
    topic: 'Modules',
    level: 'mid',
  },

  // ── Configuration & Performance ──────────────────────────────────────────────
  {
    q: 'What is the difference between `target` and `lib` in tsconfig?',
    a: 'target controls the JavaScript syntax TypeScript emits — "ES2022" means modern class syntax, optional chaining, etc. are kept as-is; "ES5" means they are down-compiled. lib controls what global type definitions are available to the type-checker — it is independent of target. Setting target: "ES5" does not remove Promise types unless you also set lib: ["ES5"]. Always set lib explicitly: for a browser app with a modern bundler, "lib": ["ES2022", "DOM", "DOM.Iterable"] regardless of what target says.',
    topic: 'Configuration',
    level: 'junior',
  },
  {
    q: 'What is `moduleResolution: "bundler"` and when should you use it?',
    a: '"bundler" (TypeScript 5.0+) is the moduleResolution setting designed for projects using Vite, esbuild, webpack, or similar bundlers. It resolves package.json exports maps (enabling subpath imports like "package/utils"), does not require .js extensions on relative imports (unlike node16/nodenext), and accurately models how bundlers resolve modules at runtime. Use it for any bundler-based project. Use "node16" or "nodenext" only for projects using native Node.js ESM (where .js extensions are required at runtime).',
    topic: 'Configuration',
    level: 'mid',
  },
  {
    q: 'What does `isolatedModules: true` do and why does Vite require it?',
    a: 'isolatedModules: true errors on TypeScript features that require cross-file analysis to compile: const enum (values cannot be inlined without seeing all usage sites), namespace exports, and non-type imports used only as types (require import type). Vite uses esbuild under the hood, which transpiles each file independently without a full program — it physically cannot perform cross-file analysis. isolatedModules: true makes TypeScript error at development time on code that would silently fail at build time with esbuild.',
    topic: 'Configuration',
    level: 'mid',
  },
  {
    q: 'How do you speed up TypeScript builds in CI?',
    a: 'Three complementary strategies: (1) incremental: true writes a .tsbuildinfo cache file — subsequent builds skip unchanged files. Cache this file between CI runs using GitHub Actions cache (key on tsconfig.json hash). (2) Separate type-checking from transpilation — use tsc --noEmit in CI for type-checking, and esbuild/Vite for the actual build. (3) composite: true for monorepos — each package has its own cache, tsc --build only rebuilds changed packages. Additional: set skipLibCheck: true (skip .d.ts checking), narrow include to src only, and limit "types" to only what you use.',
    topic: 'Configuration',
    level: 'mid',
  },

  // ── Practical Patterns ───────────────────────────────────────────────────────
  {
    q: 'How do you type a function that accepts different argument shapes depending on a condition?',
    a: 'Use function overloads. Declare the overload signatures first, then implement with a union signature: function format(value: string): string; function format(value: number, precision: number): string; function format(value: string | number, precision?: number): string { ... }. TypeScript uses the overload signatures for call-site checking; the implementation signature is invisible to callers. Alternatively, use a discriminated union parameter or a conditional generic for the return type. Overloads are best when the relationship between inputs and outputs is complex.',
    topic: 'Patterns',
    level: 'mid',
  },
  {
    q: 'What is declaration merging and how does it work with interfaces?',
    a: 'Declaration merging combines multiple declarations with the same name into a single type. Two interface Foo { } declarations in different files merge into one Foo with all members from both. This is the mechanism behind module augmentation — adding to Express Request types via declare module "express" works because TypeScript merges your interface additions with the existing Request interface. type aliases cannot merge — a duplicate type alias is always an error. Classes can merge with namespaces (adding static members) and with interfaces (adding prototype members).',
    topic: 'Patterns',
    level: 'mid',
  },
  {
    q: 'How do you write a type-safe event emitter in TypeScript?',
    a: 'Use a generic EventMap type and constrain event names to its keys: class TypedEventEmitter<TMap extends Record<string, unknown>> { on<K extends keyof TMap>(event: K, handler: (data: TMap[K]) => void): void { ... } emit<K extends keyof TMap>(event: K, data: TMap[K]): void { ... } } Usage: const emitter = new TypedEventEmitter<{ userCreated: User; error: Error }>(); emitter.on("userCreated", user => user.name); // user is typed User. The indexed access TMap[K] gives the correct payload type for each event name without any casting.',
    topic: 'Patterns',
    level: 'senior',
  },
  {
    q: 'What is the branded/opaque type pattern and when do you use it?',
    a: 'Branded types add a phantom property to a primitive to prevent mistaking one kind of string/number for another: type UserId = string & { readonly _brand: "UserId" }; type PostId = string & { readonly _brand: "PostId" }. Now getPost(id: PostId) rejects a plain string or a UserId at compile time. The brand is never set at runtime — you use a factory: const toPostId = (id: string): PostId => id as PostId. Use this when domain values are the same runtime type but semantically different (user IDs vs post IDs, raw SQL vs validated SQL, dollars vs euros).',
    topic: 'Patterns',
    level: 'senior',
  },
  {
    q: 'How does TypeScript handle covariance and contravariance?',
    a: 'Covariance means a type can be substituted with a subtype (safe for outputs). Contravariance means a type can be substituted with a supertype (safe for inputs). TypeScript checks function parameter types contravariantly with strictFunctionTypes: true (part of strict). A function expecting Animal is assignable to a function expecting Dog (Dog is a subtype of Animal) — contravariant because the caller of the function-accepting-Animal must provide something a Dog handler can handle. Return types are covariant. Without strictFunctionTypes, TypeScript used bivariant function parameters — allowing unsound substitutions.',
    topic: 'Patterns',
    level: 'senior',
  },
];

@Component({
  selector: 'app-ts-interview-prep',
  standalone: true,
  imports: [],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class TsInterviewPrep {
  questions = QUESTIONS;

  topics = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];
  levels: ('All' | 'junior' | 'mid' | 'senior')[] = ['All', 'junior', 'mid', 'senior'];

  activeTopic = signal('All');
  activeLevel = signal<'All' | 'junior' | 'mid' | 'senior'>('All');
  openIndex  = signal<number | null>(null);

  filtered = computed(() => {
    const topic = this.activeTopic();
    const level = this.activeLevel();
    return QUESTIONS.filter(q =>
      (topic === 'All' || q.topic === topic) &&
      (level === 'All' || q.level === level)
    );
  });

  toggle(i: number) { this.openIndex.update(v => v === i ? null : i); }
  setTopic(t: string) { this.activeTopic.set(t); this.openIndex.set(null); }
  setLevel(l: 'All' | 'junior' | 'mid' | 'senior') { this.activeLevel.set(l); this.openIndex.set(null); }

  levelLabel(l: string): string {
    return { junior: 'Junior', mid: 'Mid', senior: 'Senior' }[l] ?? l;
  }
}
