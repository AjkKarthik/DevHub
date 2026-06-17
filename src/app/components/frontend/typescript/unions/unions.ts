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
  selector: 'app-ts-unions',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './unions.html',
  styleUrl: './unions.scss',
})
export class TsUnions {
  quickRef: QuickRefItem[] = [
    { name: '|',                   type: 'operator', desc: 'Union — value is one of A OR B: string | number' },
    { name: '&',                   type: 'operator', desc: 'Intersection — value satisfies ALL of A AND B: A & B' },
    { name: 'discriminated union', type: 'keyword',  desc: 'Union with a shared literal property used to narrow: kind: "circle" | "square"' },
    { name: 'typeof',              type: 'operator', desc: 'Narrow primitives: if (typeof x === "string")' },
    { name: 'instanceof',          type: 'operator', desc: 'Narrow class instances: if (x instanceof Error)' },
    { name: 'in',                  type: 'operator', desc: 'Narrow by property presence: if ("radius" in shape)' },
    { name: 'x is T',             type: 'syntax',   desc: 'User-defined type predicate — custom narrowing function' },
    { name: 'satisfies never',     type: 'keyword',  desc: 'Exhaustiveness check — compile error if a union member is unhandled' },
    { name: 'Extract<T,U>',        type: 'type',     desc: 'Filter union members assignable to U' },
    { name: 'Exclude<T,U>',        type: 'type',     desc: 'Remove union members assignable to U' },
    { name: 'NonNullable<T>',      type: 'type',     desc: 'Remove null and undefined from T' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Union types — A or B',
      points: [
        'A union type (<code>A | B</code>) means a value can be of type A, or type B, or both. You can only use operations that are valid for <em>all</em> members of the union without narrowing. For example, on <code>string | number</code> you can call <code>.toString()</code> (exists on both), but not <code>.toUpperCase()</code> (only on string).',
        'Union members can be any type — primitives, objects, literals, or even other unions. Literal unions are among the most common patterns: <code>type Status = "pending" | "fulfilled" | "rejected"</code>.',
        'Narrowing collapses a union to a specific member. TypeScript tracks narrowing through control flow — after <code>if (typeof x === "string")</code>, x is narrowed to <code>string</code> in that branch and to the remaining members in the else branch.',
        'A union with a single member is just that type. A union with <code>never</code> collapses: <code>string | never</code> = <code>string</code>. A union with <code>unknown</code> is always <code>unknown</code> (everything is assignable to unknown).',
      ],
    },
    {
      heading: 'Intersection types — A and B',
      points: [
        'An intersection type (<code>A &amp; B</code>) means a value must satisfy <em>all</em> constraints of both types simultaneously. The result has every property from both A and B.',
        'Intersections on object types combine their properties: <code>{ a: string } &amp; { b: number }</code> = <code>{ a: string; b: number }</code>. This is how many utility patterns (mixin, extend-via-type) work.',
        'Intersecting <em>primitive</em> types usually gives <code>never</code>: a value cannot be both a <code>string</code> and a <code>number</code> simultaneously. This is the mathematical intersection of disjoint sets.',
        'When the same property exists in both sides of an intersection, their types are themselves intersected: <code>{ x: string } &amp; { x: number }</code> produces <code>{ x: string &amp; number }</code> = <code>{ x: never }</code> — be careful.',
      ],
    },
    {
      heading: 'Discriminated unions — the most useful pattern',
      points: [
        'A discriminated union (also called a tagged union or algebraic data type) is a union of object types that share a common literal property — the <em>discriminant</em>. TypeScript uses the discriminant to narrow to the exact member.',
        'Pattern: give each member a literal <code>kind</code> (or <code>type</code>) property: <code>{ kind: "circle"; radius: number } | { kind: "square"; side: number }</code>. In a switch on <code>shape.kind</code>, each case is narrowed to the exact member — no need for casting.',
        'Discriminated unions are the TypeScript way to model algebraic data types (like Rust\'s <code>enum</code> or Haskell\'s data types). They are more type-safe than class hierarchies because the compiler can verify exhaustiveness.',
        'Every discriminated union should have an exhaustiveness check in the default branch to catch missing cases when the union gains new members in the future.',
      ],
    },
    {
      heading: 'Narrowing techniques',
      points: [
        '<code>typeof x === "string"</code>: narrows primitives (<code>string</code>, <code>number</code>, <code>boolean</code>, <code>bigint</code>, <code>symbol</code>, <code>undefined</code>, <code>function</code>). Note: <code>typeof null === "object"</code> — always check null separately.',
        '<code>x instanceof ClassName</code>: narrows to class instances. Works for classes and their subclasses. Does NOT work for plain interfaces (they have no runtime representation).',
        '<code>"property" in x</code>: narrows to union members that have the named property. Useful when union members don\'t share a literal discriminant but have distinct structural properties.',
        'Truthiness narrowing: <code>if (value)</code> removes <code>null</code>, <code>undefined</code>, <code>0</code>, <code>""</code>, <code>false</code>, <code>NaN</code>. Use carefully — a zero or empty string might be a valid value you don\'t want to exclude.',
        'Equality narrowing: <code>if (x === "literal")</code> narrows to the exact literal. In a switch statement on a discriminant, each case branch narrows to that member.',
      ],
    },
    {
      heading: 'User-defined type predicates',
      points: [
        'When the built-in narrowing operators (<code>typeof</code>, <code>instanceof</code>, <code>in</code>) are not enough, you can write a <em>type predicate function</em>: <code>function isString(x: unknown): x is string { return typeof x === "string"; }</code>.',
        'The return type <code>x is T</code> tells TypeScript that when this function returns <code>true</code>, the parameter is narrowed to type T. TypeScript trusts you — returning <code>true</code> on the wrong branch is an unsafe bug that compiles.',
        'Type predicates are commonly used for: validating API responses, checking if an error is a specific subtype, and narrowing values that come from external sources where the type is lost.',
        '<code>asserts x is T</code> (assertion functions) is the throwing variant — instead of returning a boolean, the function throws if x is not T. TypeScript narrows x to T for all code after the call.',
      ],
    },
    {
      heading: 'Extract, Exclude, and NonNullable',
      points: [
        '<code>Extract&lt;T, U&gt;</code> keeps only the union members of T that are assignable to U: <code>Extract&lt;"a" | "b" | "c", "a" | "c"&gt;</code> = <code>"a" | "c"</code>.',
        '<code>Exclude&lt;T, U&gt;</code> removes union members of T that are assignable to U: <code>Exclude&lt;"a" | "b" | "c", "b"&gt;</code> = <code>"a" | "c"</code>.',
        '<code>NonNullable&lt;T&gt;</code> removes <code>null</code> and <code>undefined</code> from T: <code>NonNullable&lt;string | null | undefined&gt;</code> = <code>string</code>.',
        'These utility types are implemented using conditional types: <code>Exclude&lt;T, U&gt; = T extends U ? never : T</code>. Understanding this helps when the utility types don\'t behave as expected on complex unions.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Union Types',
      language: 'typescript',
      code: `// Basic union
type StringOrNumber = string | number;
let value: StringOrNumber = 'hello';
value = 42;           // ✅ both are valid

// You can only use what's common to ALL members:
value.toString();     // ✅ exists on string and number
// value.toUpperCase(); ❌ only on string — must narrow

// Literal union
type Status = 'pending' | 'fulfilled' | 'rejected';
type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;
type Direction = 'north' | 'south' | 'east' | 'west';

// Union with null/undefined (very common)
type MaybeString = string | null | undefined;
function greet(name: MaybeString) {
  if (!name) return 'Hello, stranger!';
  return \`Hello, \${name}!\`; // name is string here
}

// Union collapse rules
type T1 = string | never;    // string (never disappears)
type T2 = string | unknown;  // unknown (unknown absorbs all)`,
    },
    {
      label: 'Intersection Types',
      language: 'typescript',
      code: `// Intersection combines all properties
type A = { a: string; shared: string };
type B = { b: number; shared: string };
type AB = A & B; // { a: string; b: number; shared: string }

const ab: AB = { a: 'hello', b: 42, shared: 'both' };

// Mixin pattern via intersection
type Timestamps = { createdAt: Date; updatedAt: Date };
type SoftDelete = { deletedAt: Date | null };
type Entity<T> = T & Timestamps & SoftDelete;

type User = Entity<{ id: number; name: string }>;
// User = { id: number; name: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null }

// Conflicting properties → nested never
type X = { val: string } & { val: number };
// X.val: string & number = never — objects of this type cannot be created

// Primitive intersections → never
type Impossible = string & number; // never`,
    },
    {
      label: 'Discriminated Unions',
      language: 'typescript',
      code: `// Each member has a unique literal on 'kind'
type Shape =
  | { kind: 'circle';    radius: number }
  | { kind: 'square';    side: number   }
  | { kind: 'rectangle'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':    return Math.PI * s.radius ** 2;
    case 'square':    return s.side ** 2;
    case 'rectangle': return s.width * s.height;
    default:
      s satisfies never; // ❌ compile error if Shape gains a new member
      throw new Error('Unknown shape');
  }
}

// Result<T, E> — discriminated union for error handling
type Result<T, E = Error> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: 'Division by zero' };
  return { ok: true, value: a / b };
}

const res = divide(10, 2);
if (res.ok) console.log(res.value);   // res: { ok: true; value: number }
else        console.error(res.error);  // res: { ok: false; error: string }`,
    },
    {
      label: 'Narrowing Techniques',
      language: 'typescript',
      code: `type Input = string | number | boolean | null | undefined;

function process(val: Input) {
  // typeof narrowing
  if (typeof val === 'string')  return val.toUpperCase();
  if (typeof val === 'number')  return val.toFixed(2);
  if (typeof val === 'boolean') return val ? 'yes' : 'no';
  // val: null | undefined here
  return 'nothing';
}

// instanceof narrowing
class NetworkError extends Error { statusCode = 0 }
class ValidationError extends Error { field = '' }

function handle(err: NetworkError | ValidationError) {
  if (err instanceof NetworkError) {
    console.log(err.statusCode); // NetworkError
  } else {
    console.log(err.field);      // ValidationError
  }
}

// in operator narrowing (no shared discriminant)
interface Cat { meow(): void }
interface Dog { bark(): void }
function speak(pet: Cat | Dog) {
  if ('meow' in pet) pet.meow(); // Cat
  else               pet.bark(); // Dog
}

// Truthiness — beware of 0 and ""
function printLength(s: string | null) {
  if (s) console.log(s.length); // ✅ but skips "" which might be valid
  if (s !== null) console.log(s.length); // ✅ more precise
}`,
    },
    {
      label: 'Type Predicates & Extract/Exclude',
      language: 'typescript',
      code: `// User-defined type predicate
interface Fish { swim(): void }
interface Bird { fly(): void }

function isFish(pet: Fish | Bird): pet is Fish {
  return 'swim' in pet;
}

const pet: Fish | Bird = getRandomPet();
if (isFish(pet)) pet.swim(); // ✅ pet: Fish
else             pet.fly();  // ✅ pet: Bird

// Assertion function (throws instead of returning boolean)
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') throw new Error('Not a string!');
}
const raw: unknown = fetchData();
assertIsString(raw);
raw.toUpperCase(); // ✅ raw is now string

// Extract — keep matching members
type Events = 'click' | 'focus' | 'change' | 'submit';
type FormEvents = Extract<Events, 'change' | 'submit'>;  // "change" | "submit"

// Exclude — remove matching members
type NonFormEvents = Exclude<Events, 'change' | 'submit'>; // "click" | "focus"

// NonNullable — remove null and undefined
type Nullable = string | number | null | undefined;
type Clean = NonNullable<Nullable>; // string | number`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using union when discriminated union is needed',
      wrong: `type Response = { data: any; error: string | null };
// Callers must check both every time, types are muddy
function handle(r: Response) {
  if (r.error) { /* ... */ }
  else { r.data.whatever; } // still untyped any`,
      right: `type Response<T> =
  | { ok: true;  data: T     }
  | { ok: false; error: string };

function handle(r: Response<User>) {
  if (r.ok) r.data.name;  // r: { ok: true; data: User }
  else      r.error;      // r: { ok: false; error: string }
}`,
      explanation: 'A discriminated union with a shared literal property lets TypeScript narrow to the exact member automatically, with no ambiguity and full type safety.',
    },
    {
      title: 'Forgetting the exhaustiveness check',
      wrong: `type Color = 'red' | 'green' | 'blue';
function hex(c: Color): string {
  if (c === 'red')   return '#f00';
  if (c === 'green') return '#0f0';
  return ''; // blue falls through silently — no error`,
      right: `function hex(c: Color): string {
  if (c === 'red')   return '#f00';
  if (c === 'green') return '#0f0';
  if (c === 'blue')  return '#00f';
  c satisfies never; // compile error when Color adds a new member
  throw new Error('Unreachable');
}`,
      explanation: 'Always add an exhaustiveness check to switch/if chains over union types. It turns missing cases into compile-time errors instead of silent bugs.',
    },
    {
      title: 'Unsafe type predicates that return the wrong boolean',
      wrong: `function isUser(val: unknown): val is User {
  return true; // ❌ always returns true — TypeScript trusts this!
}
isUser(42);    // returns true, val is narrowed to User — runtime crash`,
      right: `function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' && val !== null &&
    'id'   in val && typeof (val as any).id   === 'number' &&
    'name' in val && typeof (val as any).name === 'string'
  );
}`,
      explanation: 'TypeScript trusts type predicates unconditionally. A wrong implementation silently corrupts types. Always validate every required property in the predicate body.',
    },
    {
      title: 'Using truthiness to narrow when 0 or "" are valid',
      wrong: `function printCount(count: number | null) {
  if (count) console.log(\`Count: \${count}\`);
  // count === 0 is silently skipped — a valid value!`,
      right: `function printCount(count: number | null) {
  if (count !== null) console.log(\`Count: \${count}\`);
  // 0 is now correctly handled
}`,
      explanation: 'Truthiness narrowing removes null AND undefined AND falsy primitives (0, "", false). Be explicit with !== null / !== undefined when 0 or "" are valid values.',
    },
    {
      title: 'Conflating union (|) with intersection (&)',
      wrong: `// Trying to combine properties with | (union)
type Combined = { a: string } | { b: number };
const obj: Combined = { a: 'hi', b: 42 }; // ✅ compiles
obj.a; // ❌ Error: a may not exist (could be { b: number } member)`,
      right: `// Use & (intersection) to require ALL properties
type Combined = { a: string } & { b: number };
const obj: Combined = { a: 'hi', b: 42 }; // ✅
obj.a; // ✅ always present — both sides required`,
      explanation: '| (union) means "one or the other" — you only get what is common to all members. & (intersection) means "all of both" — every property is guaranteed present.',
    },
    {
      title: 'Intersecting conflicting property types',
      wrong: `type WidgetA = { value: string };
type WidgetB = { value: number };
type Combined = WidgetA & WidgetB;
// Combined.value is string & number = never
// No object can ever satisfy this type`,
      right: `// Either use a union for the property:
type Combined = { value: string | number };
// Or use different property names:
type WidgetA = { stringValue: string };
type WidgetB = { numValue: number };
type Combined = WidgetA & WidgetB;`,
      explanation: 'When the same property appears in both sides of an intersection, its types are intersected. Conflicting primitive types produce never, making the type uninhabitable.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a type-safe command dispatcher',
    language: 'typescript',
    description: 'Create a command dispatcher using discriminated unions. Define at least 3 command types (each with a unique "type" field), implement a dispatch() function that handles all of them, and add an exhaustiveness check so adding a new command type without handling it causes a compile error.',
    hints: [
      'Define each command as an object type with a literal "type" field as the discriminant',
      'Use a switch on command.type to dispatch — TypeScript narrows to the exact command in each case',
      'Add "default: command satisfies never" to the switch for the exhaustiveness check',
      'Consider using Result<T, E> as the return type to handle both success and error paths',
    ],
    starterCode: `// Define your command types here
type Command =
  | { type: 'CREATE_USER'; name: string; email: string }
  | { type: 'DELETE_USER'; userId: number }
  | { type: 'UPDATE_EMAIL'; userId: number; newEmail: string };

// TODO: implement dispatch(command: Command): string
// Return a description of what happened
// Add an exhaustiveness check in the default branch

const result1 = dispatch({ type: 'CREATE_USER', name: 'Alice', email: 'a@b.com' });
const result2 = dispatch({ type: 'DELETE_USER', userId: 1 });`,
    solution: `type Command =
  | { type: 'CREATE_USER';  name: string; email: string }
  | { type: 'DELETE_USER';  userId: number }
  | { type: 'UPDATE_EMAIL'; userId: number; newEmail: string };

type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

function dispatch(cmd: Command): Result<string> {
  switch (cmd.type) {
    case 'CREATE_USER':
      // cmd: { type: 'CREATE_USER'; name: string; email: string }
      return { ok: true, value: \`Created user \${cmd.name} (\${cmd.email})\` };

    case 'DELETE_USER':
      // cmd: { type: 'DELETE_USER'; userId: number }
      return { ok: true, value: \`Deleted user #\${cmd.userId}\` };

    case 'UPDATE_EMAIL':
      // cmd: { type: 'UPDATE_EMAIL'; userId: number; newEmail: string }
      return { ok: true, value: \`Updated #\${cmd.userId} → \${cmd.newEmail}\` };

    default:
      cmd satisfies never; // ❌ compile error if Command gains a new member
      return { ok: false, error: 'Unknown command' };
  }
}

const r = dispatch({ type: 'CREATE_USER', name: 'Alice', email: 'a@b.com' });
if (r.ok) console.log(r.value);   // "Created user Alice (a@b.com)"
else      console.error(r.error);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'On a value of type `string | number`, which operation is allowed WITHOUT narrowing?',
      options: ['.toUpperCase()', '.toFixed()', '.toString()', '.trim()'],
      answer: 2,
      explanation: '.toString() exists on both string and number, so it is accessible without narrowing. The other methods only exist on one of the two types.',
    },
    {
      q: 'What is a discriminated union?',
      options: [
        'A union with only two members',
        'A union of object types with a shared literal property used for narrowing',
        'A union that has been narrowed by a type predicate',
        'A union of primitive types',
      ],
      answer: 1,
      explanation: 'A discriminated union is a union of object types that share a common literal-typed property (the discriminant). TypeScript uses that property to narrow to the exact member.',
    },
    {
      q: 'What does `string & number` evaluate to?',
      options: ['string | number', 'any', 'never', 'unknown'],
      answer: 2,
      explanation: 'The intersection of string and number is never — no value can be both a string and a number simultaneously.',
    },
    {
      q: 'What does `x satisfies never` in a switch default branch do?',
      options: [
        'Throws a runtime error',
        'Causes a compile error if x is not the never type at that point',
        'Narrows x to never',
        'Removes x from scope',
      ],
      answer: 1,
      explanation: 'If all union members are handled, x is narrowed to never in the default branch — and satisfies never passes. If a case is missing, x still has a type and the compile fails.',
    },
    {
      q: 'A function returns `pet is Fish`. What does this tell TypeScript?',
      options: [
        'The function only accepts Fish instances',
        'When the function returns true, the argument is narrowed to Fish',
        'The function throws if pet is not a Fish',
        'pet must already be typed as Fish',
      ],
      answer: 1,
      explanation: 'A type predicate (x is T) tells TypeScript that when the function returns true, the parameter should be narrowed to T in the calling scope.',
    },
    {
      q: 'What does `Extract<"a" | "b" | "c", "a" | "c">` produce?',
      options: ['"b"', '"a" | "c"', '"a" | "b" | "c"', 'never'],
      answer: 1,
      explanation: 'Extract keeps only the union members assignable to the second argument. "a" and "c" are in both, so the result is "a" | "c".',
    },
    {
      q: 'Why is truthiness narrowing dangerous for `number | null`?',
      options: [
        'TypeScript does not support truthiness narrowing',
        'It skips null AND also skips 0 — which might be a valid number',
        'It only works with undefined, not null',
        'It widens the type instead of narrowing it',
      ],
      answer: 1,
      explanation: 'if (value) removes null, undefined, 0, "", false, and NaN. If 0 is a valid value in your domain, use !== null instead of truthiness.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use union (|) vs intersection (&)?',
      a: 'Use | (union) when a value can be one of several types and you handle each case separately. Use & (intersection) when you need a value that satisfies all constraints of multiple types simultaneously — essentially combining all their properties into one.',
    },
    {
      q: 'What makes a union "discriminated"?',
      a: 'A discriminated union is a union where every member has a shared property with a unique literal type for that member (e.g., kind: "circle" | "square"). TypeScript uses that shared literal property to narrow to the exact member in a switch or if statement, giving you full type safety without casting.',
    },
    {
      q: 'How is a type predicate different from a regular boolean check?',
      a: 'A regular boolean check is just a condition — TypeScript does not know what the result implies about the type. A type predicate (x is T) informs TypeScript that when this function returns true, the argument x should be narrowed to type T in the caller\'s scope. TypeScript trusts you — a wrong implementation is a bug.',
    },
    {
      q: 'Can I use instanceof to narrow to an interface?',
      a: 'No. instanceof only works with classes (which have a runtime constructor function). Interfaces are erased at compile time and have no runtime representation. To narrow to an interface, use typeof, in, or a custom type predicate that checks for required properties.',
    },
    {
      q: 'What is the difference between Extract and Exclude?',
      a: 'Extract<T, U> keeps the members of T that ARE assignable to U. Exclude<T, U> removes the members of T that ARE assignable to U. They are opposites. Both are implemented using conditional types: Exclude<T, U> = T extends U ? never : T.',
    },
    {
      q: 'Why does `{ a: string } | { b: number }` let me assign { a: "x", b: 1 } but not access .a?',
      a: 'A union type says the value satisfies at least one member. An object with both a and b satisfies both { a: string } and { b: number }, so it is assignable. But when reading, TypeScript only gives you what is guaranteed — only properties common to ALL members. Since b is not on { a: string }, and a is not on { b: number }, neither is guaranteed.',
    },
    {
      q: 'When should I use asserts x is T instead of x is T?',
      a: 'Use asserts x is T (an assertion function) when you want to throw if the condition fails — the function never returns normally on failure. Use x is T (a type predicate) when you return a boolean and the caller decides what to do. Assertion functions are common in test utilities and validation helpers that should crash loudly on bad input.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Union (|) means A or B — discriminated unions with a shared literal discriminant are the gold standard pattern. Intersection (&) means all of A and B — combining object properties.',
    mustKnow: [
      'On a union, only operations common to ALL members are accessible without narrowing',
      'Discriminated union: each member has a shared literal property (kind/type) — use switch for exhaustive handling',
      'Always add "satisfies never" in the default branch to catch missing union members at compile time',
      'Type predicates (x is T) are trusted by TypeScript — a wrong implementation silently corrupts types',
      'Truthiness narrowing removes 0, "", false, null, undefined — be explicit with !== null for numeric values',
      'Extract<T,U> keeps matching members; Exclude<T,U> removes them; NonNullable<T> removes null/undefined',
      'Intersection of same-named properties with conflicting types gives never for that property',
    ],
    interviewFocus: [
      'What is a discriminated union and why is it preferred over a plain union of objects?',
      'How does TypeScript\'s control flow narrowing work?',
      'What does an exhaustiveness check look like and why is it important?',
      'What is the difference between a type predicate and an assertion function?',
      'When does an intersection of types produce never?',
    ],
  };
}
