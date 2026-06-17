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
  selector: 'app-ts-strict-migration',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './strict-migration.html',
  styleUrl: './strict-migration.scss',
})
export class TsStrictMigration {
  quickRef: QuickRefItem[] = [
    { name: 'strict: true',               type: 'keyword', desc: 'Enables 8 strictness flags at once — the recommended baseline for all projects' },
    { name: 'allowJs: true',              type: 'keyword', desc: 'Include .js files in the TypeScript compilation — enables gradual migration' },
    { name: 'checkJs: true',              type: 'keyword', desc: 'Type-check .js files with JSDoc annotations — no .ts conversion required' },
    { name: 'noImplicitAny',              type: 'keyword', desc: 'Error when TypeScript infers any — forces explicit types on unannotated params' },
    { name: 'strictNullChecks',           type: 'keyword', desc: 'null and undefined are not assignable to other types without explicit union' },
    { name: 'strictPropertyInitialization', type: 'keyword', desc: 'Class properties must be initialized in constructor or with a definite assignment assertion (!)' },
    { name: '// @ts-check',              type: 'syntax',  desc: 'Enable type-checking in a .js file via a comment — no tsconfig change needed' },
    { name: '// @ts-ignore',             type: 'syntax',  desc: 'Suppress TypeScript error on the next line — use sparingly, prefer @ts-expect-error' },
    { name: '// @ts-expect-error',       type: 'syntax',  desc: 'Like @ts-ignore but errors if the next line is actually valid — safer suppression' },
    { name: '// @ts-nocheck',            type: 'syntax',  desc: 'Disable all type-checking in a file — escape hatch during migration' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What strict: true actually enables — eight flags',
      points: [
        '<code>strict: true</code> is shorthand for eight compiler flags: <strong>strictNullChecks</strong> (null/undefined are separate types), <strong>noImplicitAny</strong> (unannotated params are an error), <strong>strictFunctionTypes</strong> (function parameter contravariance), <strong>strictBindCallApply</strong> (typed bind/call/apply), <strong>strictPropertyInitialization</strong> (class fields must be initialized), <strong>strictBuiltinIteratorReturn</strong> (iterator return type is typed), <strong>noImplicitThis</strong> (this must have an explicit type in functions), and <strong>alwaysStrict</strong> (emits "use strict" in every file).',
        '<code>strictNullChecks</code> is the single most impactful flag. Without it, <code>null</code> and <code>undefined</code> are secretly assignable to every type — so a <code>string</code> variable can silently be <code>null</code> and cause a runtime crash. With it, every potentially-null value must be explicitly typed and narrowed before use.',
        '<code>noImplicitAny</code> forces you to annotate function parameters. Without it, an unannotated parameter <code>function process(data)</code> is silently typed as <code>any</code> — TypeScript stops checking it entirely. With it, you must write <code>function process(data: UserRecord)</code>.',
        'Beyond <code>strict: true</code>, consider enabling: <code>noUncheckedIndexedAccess</code> (array[i] returns T|undefined), <code>exactOptionalPropertyTypes</code> (optional props cannot be explicitly set to undefined), <code>noImplicitReturns</code> (all code paths return), <code>noFallthroughCasesInSwitch</code> (switch cases must break/return).',
      ],
    },
    {
      heading: 'Migrating JavaScript to TypeScript — the incremental approach',
      points: [
        'The three migration strategies: (1) <strong>rename-and-fix</strong> — rename .js to .ts and fix all errors before moving on; works for small codebases. (2) <strong>allowJs</strong> — add TypeScript to the project without renaming any files; migrate files one by one. (3) <strong>checkJs</strong> — type-check .js files using JSDoc annotations without renaming anything; lowest friction.',
        'The recommended incremental path: start with <code>allowJs: true</code> and <code>noEmit: true</code>. This adds TypeScript to the project while all files stay as .js. The compiler won\'t error on JS files until you opt in. Then rename files to .ts one by one, fixing type errors as you go.',
        'Prioritize which files to migrate first: start with shared utility modules and type definitions (high value, standalone), then services and data models, then UI components last (highest coupling). Files with the most tests should be migrated early — tests catch regressions.',
        'Use <code>@ts-nocheck</code> at the top of .ts files that have too many errors to fix immediately. This silences all errors in that file while you migrate the rest. Remove the comment file by file as you return to fix them.',
      ],
    },
    {
      heading: 'Adding TypeScript to an existing JS project without converting files',
      points: [
        'With <code>allowJs: true</code> and <code>checkJs: true</code>, TypeScript type-checks .js files using JSDoc annotations. Add <code>// @ts-check</code> to the top of a .js file to opt that file into type-checking without changing the tsconfig. This lets you migrate file by file without changing the file extension.',
        'JSDoc type annotations in .js files: <code>/** @type {string} */</code> above a variable, <code>/** @param {User} user */</code> for function parameters, <code>/** @returns {Promise&lt;User[]&gt;} */</code> for return types. TypeScript reads these and enforces them — full type safety without .ts files.',
        'JSDoc supports most TypeScript features: generics (<code>@template T</code>), type imports (<code>@type {import("./types").User}</code>), and even <code>@typedef</code> for defining complex types. For simple projects, JSDoc annotations may be sufficient without a full migration.',
        'The <code>// @ts-check</code> comment is particularly useful for config files (vite.config.js, webpack.config.js) — you get type-checking and autocomplete without converting them to TypeScript.',
      ],
    },
    {
      heading: 'Fixing the most common strict mode errors',
      points: [
        '<strong>strictNullChecks errors</strong>: the most common errors after enabling strict. Fixes: (1) add <code>| null</code> or <code>| undefined</code> to the type, (2) add a null guard (<code>if (x !== null)</code>), (3) use optional chaining (<code>x?.method()</code>), (4) use non-null assertion (<code>x!</code>) only when you are certain x is not null.',
        '<strong>noImplicitAny errors</strong>: function parameters without types. Fix: add explicit type annotations. For complex objects, define an interface or type alias. For third-party callback shapes, check if @types provides the type.',
        '<strong>strictPropertyInitialization errors</strong>: class properties not initialized in the constructor. Fixes: (1) initialize in the declaration (<code>name = ""</code>), (2) initialize in the constructor, (3) use definite assignment assertion (<code>name!: string</code>) when you initialize via a method called from the constructor, (4) mark as optional (<code>name?: string</code>) if it genuinely may not exist.',
        '<strong>Type \'string | undefined\' is not assignable to type \'string\'</strong>: the canonical strictNullChecks error. Fix with a guard: <code>if (value !== undefined)</code>, the nullish coalescing operator (<code>value ?? "default"</code>), or a non-null assertion (<code>value!</code>) if you are certain.',
      ],
    },
    {
      heading: 'Error suppression — when and how to use it safely',
      points: [
        'Four suppression directives, in order of preference: (1) <strong>Fix the error</strong> (always first choice). (2) <code>// @ts-expect-error</code> — suppresses the next line\'s error AND errors if the next line becomes valid (helps you notice when a suppression is no longer needed). (3) <code>// @ts-ignore</code> — suppresses without feedback when the code becomes valid. (4) <code>// @ts-nocheck</code> at file top — silences all errors in the entire file.',
        '<code>@ts-expect-error</code> is strictly better than <code>@ts-ignore</code>: if a future change makes the suppressed line valid TypeScript, <code>@ts-expect-error</code> will error telling you to remove the directive. <code>@ts-ignore</code> silently becomes a no-op — accumulated dead suppressions are a maintenance burden.',
        'Every suppression directive should have a comment explaining WHY: <code>// @ts-expect-error: third-party callback types incorrect in @types/lib v2.1 — fixed in v3</code>. Without context, future maintainers cannot evaluate whether the suppression is still valid.',
        'Set a team policy: suppressions in production code require a GitHub issue or TODO comment. Lint rules (<code>@typescript-eslint/ban-ts-comment</code>) can enforce this — requiring descriptions on all <code>@ts-ignore</code> and <code>@ts-expect-error</code> comments.',
      ],
    },
    {
      heading: 'Enabling strict mode on an existing TypeScript project',
      points: [
        'The "big bang" approach — enable strict all at once and fix everything — only works for small projects (< 20 files). For larger projects, use the incremental approach: enable one sub-flag at a time, fix those errors, commit, repeat.',
        'Recommended incremental order: (1) <code>noImplicitAny</code> — forces explicit types, catches missing annotations. (2) <code>strictNullChecks</code> — reveals all nullable bugs, highest value. (3) <code>strictPropertyInitialization</code> — class initialization safety. (4) The remaining strict flags — lower error count each. (5) Extra flags: <code>noUncheckedIndexedAccess</code>, <code>exactOptionalPropertyTypes</code>.',
        'Tooling for large migrations: <code>ts-migrate</code> (Airbnb\'s tool — automatically adds type annotations and @ts-ignore where it cannot infer). <code>TypeStat</code> (auto-fixes many noImplicitAny and strictNullChecks errors using inference). These tools help bootstrap the migration; manual review is still required.',
        'Track migration progress with a script that counts <code>// @ts-ignore</code> and <code>// @ts-nocheck</code> occurrences and <code>any</code> usage. Graph it over time. A declining count means the migration is progressing. Make it visible to the team — migrations stall when progress is invisible.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Strict mode errors & fixes',
      language: 'typescript',
      code: `// ===== strictNullChecks errors and fixes =====

// ERROR: Object is possibly 'undefined'
function getLength(arr: string[] | undefined): number {
  return arr.length; // Error! arr could be undefined
}
// Fix 1 — null guard:
function getLength1(arr: string[] | undefined): number {
  if (!arr) return 0;
  return arr.length; // TypeScript knows arr is string[] here
}
// Fix 2 — optional chaining + nullish coalescing:
function getLength2(arr: string[] | undefined): number {
  return arr?.length ?? 0;
}

// ERROR: Type 'string | undefined' is not assignable to type 'string'
const rawName = process.env.APP_NAME; // string | undefined
const name: string = rawName; // Error!
// Fix — provide a fallback:
const name2: string = rawName ?? 'MyApp';
// Or assert (use only when certain):
const name3: string = rawName!; // Non-null assertion — removes undefined from type

// ===== noImplicitAny errors and fixes =====
// ERROR: Parameter 'data' implicitly has an 'any' type
function process(data) { return data.name; } // Error!
// Fix — add explicit type:
interface DataRecord { name: string; value: number; }
function process2(data: DataRecord) { return data.name; }

// ===== strictPropertyInitialization errors =====
class UserService {
  private db: Database; // Error: not definitely assigned
  constructor() {
    this.init(); // TypeScript doesn't follow method calls
  }
  private init() { this.db = new Database(); }
}
// Fix 1 — definite assignment assertion:
class UserService2 {
  private db!: Database; // ! tells TS: trust me, it's set before use
}
// Fix 2 — initialize in constructor directly:
class UserService3 {
  private db: Database;
  constructor() { this.db = new Database(); }
}

class Database { constructor() {} }`,
    },
    {
      label: 'Incremental migration — allowJs & @ts-check',
      language: 'typescript',
      code: `// tsconfig.json for incremental migration:
// {
//   "compilerOptions": {
//     "allowJs": true,          // include .js files
//     "checkJs": false,         // don't error on .js yet (opt-in per file)
//     "strict": false,          // start lenient, tighten per file
//     "noEmit": true,
//     "outDir": "./dist"
//   },
//   "include": ["src"]
// }

// ---- src/utils.js ---- (JavaScript file, opt into type checking)
// @ts-check
// Without converting to .ts — TypeScript checks JSDoc annotations:

/** @type {string} */
let appName = 'MyApp';

/**
 * @param {string} name
 * @param {number} [age]
 * @returns {{ greeting: string; isAdult: boolean }}
 */
function greet(name, age) {
  return {
    greeting: \`Hello, \${name}\`,
    isAdult: (age ?? 0) >= 18,
  };
}

// TypeScript infers the return type from JSDoc — no .ts file needed:
const result = greet('Alice', 30);
result.greeting; // typed: string
result.isAdult;  // typed: boolean

// ---- Importing types in JSDoc ----
/** @type {import('./types').User} */
let user;

// @typedef for complex types in JS:
/**
 * @typedef {{ id: string; name: string; roles: string[] }} AuthUser
 */
/** @type {AuthUser} */
const currentUser = { id: '1', name: 'Alice', roles: ['admin'] };`,
    },
    {
      label: 'Error suppression — ts-expect-error vs ts-ignore',
      language: 'typescript',
      code: `// Prefer @ts-expect-error over @ts-ignore:

// @ts-ignore — suppresses silently, no feedback if code becomes valid
// @ts-ignore
const x: string = 42; // error suppressed — but if this line is fixed later,
                       // @ts-ignore becomes a silent no-op

// @ts-expect-error — errors if the next line DOESN'T have an error
// @ts-expect-error
const y: string = 42; // error suppressed
// If you later fix the type to number, TypeScript tells you:
// "Unused '@ts-expect-error' directive." — prompts you to remove the comment

// Always add a reason:
// @ts-expect-error: @types/legacy-lib v1.2 incorrectly types this parameter — fixed in v2
legacyLib.process(data);

// @ts-nocheck — disable entire file (migration escape hatch):
// @ts-nocheck
// Put at the very top of a file you haven't migrated yet
// Remove it once the file is cleaned up

// Using 'unknown' instead of suppression for external data:
function parseResponse(raw: unknown): string {
  // Don't: const data = raw as any; data.name → no safety
  // Do: narrow explicitly
  if (typeof raw === 'object' && raw !== null && 'name' in raw && typeof (raw as { name: unknown }).name === 'string') {
    return (raw as { name: string }).name;
  }
  throw new Error('Unexpected response shape');
}

// ESLint rule to require descriptions on suppressions:
// "@typescript-eslint/ban-ts-comment": ["error", {
//   "ts-expect-error": "allow-with-description",
//   "ts-ignore": "allow-with-description",
//   "minimumDescriptionLength": 10
// }]`,
    },
    {
      label: 'Enabling strict flags incrementally',
      language: 'typescript',
      code: `// Phase 1: noImplicitAny only
// tsconfig.json:
// { "compilerOptions": { "noImplicitAny": true } }

// Before (implicit any — no error without noImplicitAny):
function transform(data, options) { return data; }
// After:
function transform(data: Record<string, unknown>, options?: TransformOptions) { return data; }

// Phase 2: Add strictNullChecks
// { "compilerOptions": { "noImplicitAny": true, "strictNullChecks": true } }

// Common pattern — narrow optional params:
function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Unknown date';
  return date.toISOString().split('T')[0];
}

// Use nullish coalescing for defaults:
function greet(name?: string): string {
  return \`Hello, \${name ?? 'guest'}\`;
}

// Phase 3: Add all strict flags
// { "compilerOptions": { "strict": true } }

// Phase 4: Extra flags (optional but recommended)
// {
//   "noUncheckedIndexedAccess": true,  → arr[0] is T | undefined
//   "exactOptionalPropertyTypes": true, → optional props can't be set to undefined
//   "noImplicitReturns": true,          → all paths must return
//   "noFallthroughCasesInSwitch": true  → switch cases need break/return
// }

// noUncheckedIndexedAccess example:
const names: string[] = ['Alice', 'Bob'];
const first = names[0]; // string | undefined (not just string!)
if (first !== undefined) {
  console.log(first.toUpperCase()); // safe
}

// exactOptionalPropertyTypes:
interface Config { debug?: boolean }
const c: Config = { debug: undefined }; // Error with exactOptionalPropertyTypes!
const c2: Config = {};                  // OK — omit the key instead

interface TransformOptions { readonly trim?: boolean }`,
    },
    {
      label: 'Migration strategies & tooling',
      language: 'typescript',
      code: `// Strategy 1: File-by-file rename (small projects)
// 1. Rename utils.js → utils.ts
// 2. Fix all TypeScript errors in utils.ts
// 3. Repeat for each file
// Works well for < 20 files

// Strategy 2: allowJs + migrate one file at a time (medium projects)
// tsconfig.json: "allowJs": true, "strict": false
// Rename one file per PR:
// - utils/dates.js → utils/dates.ts (fix errors, commit)
// - utils/strings.js → utils/strings.ts (fix errors, commit)
// - services/user.js → services/user.ts (fix errors, commit)
// Each file migrated = one PR = reviewable, reversible

// Strategy 3: ts-migrate (large projects — Airbnb's approach)
// npx ts-migrate-full migrate --project . src
// Automatically: renames .js to .ts, adds @ts-ignore where it can't infer,
//                adds basic type annotations where inference works
// Result: all files are .ts but many have @ts-ignore — compile with no errors
// Then: go file by file removing @ts-ignore and fixing real types

// Tracking migration progress:
// package.json scripts:
// "check:any":    "grep -r 'any' src --include='*.ts' | grep -v '.d.ts' | wc -l"
// "check:ignore": "grep -r '@ts-ignore\\|@ts-nocheck' src | wc -l"

// Prioritize migration order:
// ✅ Migrate FIRST: shared utilities, type definitions, service layer
// ⏱ Migrate NEXT: data models, API clients, state management
// 🕐 Migrate LAST: UI components, tests (highest coupling, most files)

// Type assertion vs type annotation — prefer annotation when possible:
// Avoid (assertion bypasses checking):
const user = {} as User;
// Prefer (annotation checks the assignment):
const user2: User = { id: '1', name: 'Alice' }; // Error if fields missing

// Gradual strictness with per-directory tsconfig overrides:
// src/legacy/tsconfig.json (extends root, overrides to be lenient):
// { "extends": "../../tsconfig.json", "compilerOptions": { "strict": false } }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using non-null assertion (!) instead of a proper guard',
      wrong: `function getUser(id: string): User | undefined {
  return users.find(u => u.id === id);
}
const user = getUser('1')!; // silently asserts non-null
console.log(user.name);     // runtime crash if getUser returns undefined`,
      right: `const user = getUser('1');
if (!user) {
  throw new Error(\`User not found: 1\`);
}
console.log(user.name); // TypeScript narrows to User — safe

// Or return a default:
const user2 = getUser('1') ?? createDefaultUser();

// Use ! only when you KNOW the value exists and TypeScript cannot see why:
// e.g. after an external mutation, or in a test setup where fixtures are pre-loaded`,
      explanation: 'The non-null assertion (!) tells TypeScript to ignore the possibility of null/undefined. It does not add any runtime check — it is purely a type-level lie. Use it sparingly and only when you can guarantee the value is non-null. Prefer guards, optional chaining, or nullish coalescing for safe handling.',
    },
    {
      title: 'Suppressing errors with @ts-ignore instead of @ts-expect-error',
      wrong: `// @ts-ignore
const result = legacyFn(data);
// If legacyFn is later fixed and this line becomes valid,
// @ts-ignore silently becomes a no-op — dead suppression accumulates`,
      right: `// @ts-expect-error: legacyFn parameter type mismatch — tracked in issue #456
const result = legacyFn(data);
// If legacyFn is fixed, TypeScript reports:
// "Unused '@ts-expect-error' directive." → prompts you to clean up`,
      explanation: '@ts-expect-error is strictly safer than @ts-ignore because it fails loudly when the suppressed error goes away. This prevents dead suppression comments from accumulating as the codebase evolves. Always prefer @ts-expect-error and include a reason comment so future maintainers understand the context.',
    },
    {
      title: 'Enabling all strict flags at once on a large existing codebase',
      wrong: `// tsconfig.json on a 200-file JS → TS migration:
{ "compilerOptions": { "strict": true } }
// Result: 2000+ TypeScript errors — team is overwhelmed, migration stalls`,
      right: `// Enable flags one at a time across multiple PRs:
// PR 1: { "noImplicitAny": true } — fix ~300 annotations
// PR 2: { "noImplicitAny": true, "strictNullChecks": true } — fix ~600 null guards
// PR 3: add remaining strict sub-flags — fewer errors each time

// Use @ts-nocheck on files not ready yet:
// @ts-nocheck ← top of file, remove when ready
// Track count of @ts-nocheck occurrences — declining = progress`,
      explanation: 'Enabling strict: true on a large legacy codebase produces hundreds or thousands of errors simultaneously. Teams freeze, the PR never lands, and morale collapses. The incremental approach (one flag at a time, fix and commit) keeps the codebase always compiling and makes progress measurable.',
    },
    {
      title: 'Using type assertion `as Type` instead of narrowing for external data',
      wrong: `async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const data = await res.json() as User; // assertion — no runtime check!
  return data; // data.name might be undefined if API shape changed
}`,
      right: `import { z } from 'zod';
const UserSchema = z.object({ id: z.string(), name: z.string(), email: z.string() });

async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const raw = await res.json() as unknown;
  return UserSchema.parse(raw); // validates at runtime, throws if shape is wrong
}

// Without Zod — manual narrowing:
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null
    && typeof (v as { name: unknown }).name === 'string';
}`,
      explanation: 'Type assertions (as User) are a compile-time-only claim — TypeScript believes you. If the API returns a different shape, you get runtime crashes with no type error. For external data (API responses, JSON, user input), always validate at runtime using Zod, a type guard, or similar. Type assertions are for internal code where you have already verified the shape.',
    },
    {
      title: 'Not annotating class properties — relying on constructor inference',
      wrong: `class ApiClient {
  baseUrl; // TypeScript infers 'string' from constructor, but only with strictPropertyInitialization off
  timeout; // inferred as 'number'
  constructor(baseUrl: string, timeout = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }
}`,
      right: `class ApiClient {
  readonly baseUrl: string;   // explicit type + readonly
  timeout: number;
  constructor(baseUrl: string, timeout = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }
}

// Or use parameter properties (TypeScript shorthand):
class ApiClient2 {
  constructor(
    readonly baseUrl: string,
    public timeout: number = 5000,
  ) {}
}`,
      explanation: 'Without strict mode, TypeScript infers class property types from constructor assignments. With strictPropertyInitialization: true, unannotated properties that aren\'t initialized in the declaration become errors. Always annotate class properties explicitly — it is also better documentation for readers.',
    },
    {
      title: 'Adding types to every file at once during migration (wrong order)',
      wrong: `// Migrating a 50-file project:
// Convert all 50 files to .ts on day 1
// Now 50 files of errors — each file depends on untyped versions of the others
// Cascading any types — fixing one file surfaces errors in 10 others`,
      right: `// Migrate bottom-up — start with leaf modules (no internal imports):
// 1. src/utils/dates.ts  ← no dependencies on internal modules
// 2. src/utils/strings.ts ← no dependencies
// 3. src/models/user.ts ← depends on utils (already typed)
// 4. src/services/user-service.ts ← depends on models (already typed)
// 5. src/api/routes.ts ← depends on services (already typed)
// Each step builds on fully-typed foundations — errors are isolated`,
      explanation: 'Migrating all files simultaneously creates cascading errors because each untyped file emits any types that spread through the codebase. Starting with leaf modules (files that have no internal dependencies) and working up the dependency tree means each migration step builds on clean foundations.',
    },
  ];

  challenge: Challenge = {
    title: 'Migrate a JS module to strict TypeScript',
    language: 'typescript',
    description: `Convert the following JavaScript module to TypeScript with strict: true. Fix all strictNullChecks and noImplicitAny errors. Replace type assertions with proper type guards where needed. The module manages a simple in-memory task list.`,
    hints: [
      'Add an interface for Task with proper field types (id, title, done, createdAt)',
      'The find() method returns T | undefined — guard before accessing properties',
      'Class properties need explicit type annotations with strictPropertyInitialization',
      'The filter callback parameter needs an explicit type annotation (noImplicitAny)',
      'Use optional chaining and nullish coalescing where appropriate',
    ],
    starterCode: `// BEFORE: JavaScript version (no types)
class TaskManager {
  tasks = [];

  add(title) {
    const task = { id: Date.now().toString(), title, done: false, createdAt: new Date() };
    this.tasks.push(task);
    return task;
  }

  complete(id) {
    const task = this.tasks.find(t => t.id === id);
    task.done = true; // crash if not found!
    return task;
  }

  getByStatus(done) {
    return this.tasks.filter(t => t.done === done);
  }

  getSummary() {
    return {
      total: this.tasks.length,
      done: this.tasks.filter(t => t.done).length,
      pending: this.tasks.filter(t => !t.done).length,
    };
  }
}`,
    solution: `// AFTER: TypeScript with strict: true

interface Task {
  readonly id: string;
  title: string;
  done: boolean;
  readonly createdAt: Date;
}

interface TaskSummary {
  total: number;
  done: number;
  pending: number;
}

class TaskManager {
  private readonly tasks: Task[] = [];

  add(title: string): Task {
    const task: Task = {
      id: Date.now().toString(),
      title,
      done: false,
      createdAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  complete(id: string): Task {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error(\`Task not found: \${id}\`);
    }
    task.done = true;
    return task;
  }

  getByStatus(done: boolean): Task[] {
    return this.tasks.filter((t: Task) => t.done === done);
  }

  getSummary(): TaskSummary {
    return {
      total:   this.tasks.length,
      done:    this.tasks.filter((t: Task) => t.done).length,
      pending: this.tasks.filter((t: Task) => !t.done).length,
    };
  }
}

const manager = new TaskManager();
const t1 = manager.add('Buy groceries');
const t2 = manager.add('Write tests');
manager.complete(t1.id);
console.log(manager.getSummary()); // { total: 2, done: 1, pending: 1 }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following is NOT one of the eight flags enabled by strict: true?',
      options: [
        'strictNullChecks',
        'noImplicitAny',
        'noUncheckedIndexedAccess',
        'strictFunctionTypes',
      ],
      answer: 2,
      explanation: 'noUncheckedIndexedAccess is NOT part of strict: true — it is a separate, additional flag. The eight flags in strict: true are: strictNullChecks, noImplicitAny, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, strictBuiltinIteratorReturn, noImplicitThis, and alwaysStrict.',
    },
    {
      q: 'Why is `@ts-expect-error` preferred over `@ts-ignore`?',
      options: [
        '@ts-expect-error is newer and replaces @ts-ignore',
        '@ts-expect-error errors when the suppressed line becomes valid — alerting you to remove the directive; @ts-ignore silently becomes a no-op',
        '@ts-expect-error works on multiple lines while @ts-ignore only works on one',
        '@ts-ignore causes build failures in strict mode',
      ],
      answer: 1,
      explanation: '@ts-expect-error reports an "Unused @ts-expect-error directive" error if the next line is actually valid TypeScript. This prompts cleanup when the underlying issue is fixed. @ts-ignore silently becomes a no-op — dead suppressions accumulate without any signal to remove them.',
    },
    {
      q: 'What is the recommended order for enabling strict sub-flags incrementally?',
      options: [
        'Start with strictPropertyInitialization, then strictFunctionTypes, then noImplicitAny',
        'Start with noImplicitAny (add annotations), then strictNullChecks (null guards), then the rest',
        'Enable strict: true all at once and suppress errors with @ts-nocheck per file',
        'Enable strictNullChecks first since it catches the most bugs',
      ],
      answer: 1,
      explanation: 'The recommended order: noImplicitAny first (forces type annotations — cleaner code for later steps), then strictNullChecks (reveals nullable bugs — highest value), then the remaining strict sub-flags (smaller error count). This approach keeps the build green at each step.',
    },
    {
      q: 'What does `allowJs: true` in tsconfig enable?',
      options: [
        'Allows JavaScript syntax in TypeScript files (arrow functions, destructuring)',
        'Includes .js files in the TypeScript compilation — the foundation for gradual JS-to-TS migration',
        'Enables JavaScript output files from the TypeScript compiler',
        'Allows any type in TypeScript files without errors',
      ],
      answer: 1,
      explanation: 'allowJs: true tells TypeScript to include .js files in its compilation. This is the key setting for gradual migration — your project can mix .ts and .js files. TypeScript does not error on .js files unless checkJs: true is also set.',
    },
    {
      q: 'When migrating a large JS codebase to TypeScript, what order should files be migrated?',
      options: [
        'Alphabetically — start with "a" files',
        'Top-down — entry points first, then dependencies',
        'Bottom-up — leaf modules (no internal deps) first, then files that depend on them',
        'Randomly — the order does not matter',
      ],
      answer: 2,
      explanation: 'Migrating bottom-up (leaf modules first) means each step builds on fully-typed foundations. When you migrate a file, all its imports are already typed — errors are isolated to the current file. Top-down migration causes cascading any types as each file depends on still-untyped modules below it.',
    },
    {
      q: 'What does `noUncheckedIndexedAccess: true` do?',
      options: [
        'Prevents accessing array elements with variables as indexes',
        'Makes array index access and Record<string, T> access return T | undefined instead of T',
        'Throws a runtime error when an array is accessed out of bounds',
        'Removes undefined from array element types',
      ],
      answer: 1,
      explanation: 'noUncheckedIndexedAccess: true adds undefined to the return type of index access operations. arr[0] returns T | undefined instead of T, and dict["key"] returns T | undefined. This reflects the reality that index access can return undefined at runtime — forcing you to guard before use.',
    },
    {
      q: 'What is the safest way to handle data from an API response in a strict TypeScript codebase?',
      options: [
        'Cast with `as User` — it is type-safe because TypeScript compiles the assertion',
        'Cast with `as unknown as User` — double assertion is always safe',
        'Use a runtime validator (Zod, type guard) to verify the shape before treating it as User',
        'Disable strictNullChecks for API response handling files',
      ],
      answer: 2,
      explanation: 'Type assertions (as User) are compile-time only — TypeScript trusts them without checking. If the API returns a different shape, you get runtime crashes with no type error warning. Runtime validation with Zod or a type predicate checks the actual data shape and narrows the type safely.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How long does a typical JS-to-TS migration take for a medium-sized project?',
      a: 'For a 50–100 file codebase, a file-by-file migration with one or two engineers typically takes 2–6 weeks. The first 20% of files takes 50% of the time — the patterns repeat after that. Factor in: initial tsconfig setup (1 day), defining shared interfaces (2–5 days), migrating utility/service files (bulk of the time), and final strict mode cleanup. Teams that try to rush it "all at once" typically stall and revert.',
    },
    {
      q: 'Should I add explicit return types to every function during migration?',
      a: 'No. Start with parameter types (required by noImplicitAny) and let TypeScript infer return types. Add explicit return types only when: (1) the function is part of a public API, (2) the inferred return type is too broad (e.g. string | number | undefined when you want string), or (3) the function has complex conditional returns where inference is hard to read. Over-annotating return types slows down migration without much benefit.',
    },
    {
      q: 'What is ts-migrate and when should I use it?',
      a: 'ts-migrate is Airbnb\'s open-source tool that automatically renames .js files to .ts and inserts @ts-ignore comments wherever TypeScript cannot infer types. It gets a large codebase compiling with no errors instantly — but with many suppressions. Use it as a starting point for large migrations (100+ files), then remove @ts-ignore comments file by file. It is not a substitute for real type annotations.',
    },
    {
      q: 'Is it worth migrating a project to TypeScript if it has good test coverage?',
      a: 'Yes — good tests and TypeScript are complementary, not alternatives. Tests catch runtime behavior bugs; TypeScript catches structural errors (wrong property names, missing arguments, null access) at development time before tests run. Projects with good coverage often see faster TypeScript migration because the tests verify that the migration did not break behavior while TypeScript catches structural issues the tests might not exercise.',
    },
    {
      q: 'How do I handle a third-party library with incorrect @types definitions?',
      a: 'Four options in order of preference: (1) Open a PR to DefinitelyTyped to fix the types. (2) Augment the incorrect types locally using module augmentation (declare module "lib" { interface Foo { missingProp: string } }). (3) Use a local copy of the @types package in a local-patches directory. (4) As a last resort, use @ts-expect-error with a comment explaining the issue and tracking it with an issue number.',
    },
    {
      q: 'What is `exactOptionalPropertyTypes` and is it worth enabling?',
      a: 'exactOptionalPropertyTypes: true distinguishes between an optional property being absent (omitted) vs being explicitly set to undefined. Without it, { debug?: boolean } allows { debug: undefined } and {} equally. With it, { debug: undefined } is an error — you must omit the key instead. It is worth enabling for new projects. On existing codebases, it catches real bugs but requires fixing many call sites that set optional props to undefined explicitly.',
    },
    {
      q: 'Can I use TypeScript in a monorepo where some packages are still plain JavaScript?',
      a: 'Yes. Set allowJs: true in the TypeScript packages that depend on the JS packages. Use @ts-nocheck or JSDoc types in the JS packages to control how much TypeScript checks them. As each JS package is ready, convert it to TypeScript and remove the allowJs dependency. This is how many companies migrate — package by package rather than the whole monorepo at once.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'strict: true enables 8 flags — most impactful are strictNullChecks and noImplicitAny. Migrate JS incrementally: allowJs + checkJs + @ts-nocheck as escape hatch, convert leaf modules first. Prefer @ts-expect-error over @ts-ignore, and runtime validation over type assertions for external data.',
    mustKnow: [
      'strict: true = 8 flags; noUncheckedIndexedAccess and exactOptionalPropertyTypes are separate',
      'strictNullChecks: null/undefined not assignable to other types — the highest-value flag',
      'noImplicitAny: unannotated params are an error — forces explicit annotations',
      'allowJs + checkJs: type-check JS files with JSDoc — no file renaming needed',
      '@ts-expect-error preferred over @ts-ignore — fails when suppression is no longer needed',
      'Migrate bottom-up: leaf modules first, entry points last — prevents cascading any types',
      'Non-null assertion (!) is a lie to the type-checker — prefer guards or optional chaining',
    ],
    interviewFocus: [
      'What does strict: true enable — name the flags and which is most impactful',
      'How would you approach adding TypeScript to an existing large JavaScript codebase?',
      'What is the difference between @ts-ignore and @ts-expect-error?',
      'Why is `as SomeType` unsafe for API responses? What should you use instead?',
      'What order should files be migrated in — and why?',
    ],
  };
}
