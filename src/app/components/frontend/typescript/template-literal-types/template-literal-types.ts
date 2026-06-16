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
  selector: 'app-ts-template-literal-types',
  standalone: true,
  imports: [
    QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './template-literal-types.html',
  styleUrl: './template-literal-types.scss',
})
export class TsTemplateLiteralTypes {
  quickRef: QuickRefItem[] = [
    { name: '`${A}${B}`',              type: 'syntax',  desc: 'Template literal type — string type built by concatenating literal types' },
    { name: '`on${Capitalize<E>}`',    type: 'syntax',  desc: 'Generate event handler names from event unions at the type level' },
    { name: 'T extends `${infer P}`',  type: 'syntax',  desc: 'Pattern matching on string literal types using infer' },
    { name: 'Uppercase<S>',            type: 'type',    desc: 'Transform string literal type to uppercase' },
    { name: 'Lowercase<S>',            type: 'type',    desc: 'Transform string literal type to lowercase' },
    { name: 'Capitalize<S>',           type: 'type',    desc: 'Uppercase the first character of a string literal type' },
    { name: 'Uncapitalize<S>',         type: 'type',    desc: 'Lowercase the first character of a string literal type' },
    { name: 'distributive TLT',        type: 'keyword', desc: 'Template literal types distribute over union members automatically' },
    { name: 'key remapping + TLT',     type: 'syntax',  desc: '[K in keyof T as `get${Capitalize<string & K>}`] — rename keys with TLT' },
    { name: 'path inference',          type: 'syntax',  desc: 'T extends `${infer Head}.${infer Tail}` — split dot-notation paths' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Template literal types — string composition at the type level',
      points: [
        'Template literal types use the same backtick syntax as JavaScript template literals, but at the type level: <code>type Greeting = \`Hello, \${string}\`</code> represents any string that starts with "Hello, ".',
        'When the embedded type is a string literal or a union of string literals, TypeScript computes all combinations: <code>type AB = \`\${"a"|"b"}\${"1"|"2"}\`</code> → <code>"a1" | "a2" | "b1" | "b2"</code>.',
        'Template literal types are fully structural — they compose with all other TypeScript features: generics, conditional types, mapped types, and infer. This enables powerful type-level string manipulation.',
        'They were added in TypeScript 4.1 and are used extensively in modern framework typings (Angular signal inputs, React event types, CSS-in-JS).',
      ],
    },
    {
      heading: 'Distribution over unions — automatic cross-product',
      points: [
        'When a template literal type contains a union, TypeScript automatically distributes and creates all string combinations: <code>\`\${"get"|"set"}\${Capitalize&lt;string&gt;\`</code> creates all get/set prefixed variants.',
        'Multiple union slots are multiplied: <code>\`\${"a"|"b"}-\${"x"|"y"}\`</code> → <code>"a-x" | "a-y" | "b-x" | "b-y"</code>. This is the cross-product of all union members.',
        'Distribution makes it trivial to generate large sets of string literal types from small building blocks — event handler names, CSS class names, API route patterns, etc.',
        'The resulting union can become very large with many union members. Keep the component unions small to avoid type-checking performance issues.',
      ],
    },
    {
      heading: 'Pattern matching with infer in template literal types',
      points: [
        'You can use <code>infer</code> inside template literal types to extract parts of a string: <code>type GetPrefix&lt;T&gt; = T extends \`\${infer P}_\${string}\` ? P : never</code>. This matches strings with an underscore and binds the part before it to P.',
        'Multiple infer in one pattern: <code>T extends \`\${infer Head}.\${infer Tail}\`</code> splits at the first dot. This enables recursive path parsing.',
        'Combined with recursion, you can parse arbitrarily deep dot-notation paths: <code>type DotPath&lt;T, Path extends string&gt; = Path extends \`\${infer K}.\${infer Rest}\` ? ... : ...</code>.',
        'Pattern matching on string types enables a whole class of type-safe string parsing that was impossible before TypeScript 4.1.',
      ],
    },
    {
      heading: 'Key remapping with template literal types',
      points: [
        'Template literal types are most commonly used in mapped type key remapping: <code>[K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;\}\`]</code> transforms every property key "name" into a getter method "getName".',
        'The <code>string &amp; K</code> intersection is required because keyof T can include symbol and number keys — Capitalize requires a string. The intersection narrows to the string subset.',
        'You can combine multiple transformations: getter and setter generation, adding CSS class prefixes, namespacing event names, converting property names to camelCase or snake_case.',
        'These patterns eliminate runtime metaprogramming — instead of using Proxy or dynamic property access, the correct property names are known at compile time and verified by TypeScript.',
      ],
    },
    {
      heading: 'Practical use cases in real codebases',
      points: [
        '<strong>Event handler names</strong>: <code>type Handlers&lt;E extends string&gt; = { [K in E as \`on\${Capitalize&lt;K&gt;\}\`]?: (e: Event) =&gt; void }</code> — generates onClick, onFocus, etc. from "click", "focus".',
        '<strong>API routes</strong>: <code>type Route = \`/api/\${string}\`</code> restricts strings to valid API route format. Combined with unions: <code>type Routes = \`/api/\${"users"|"posts"|"comments"}\`</code>.',
        '<strong>CSS-in-JS and class names</strong>: <code>type BEM = \`\${Block}__\${Element}--\${Modifier}\`</code> generates valid BEM class names.',
        '<strong>Object property paths</strong>: <code>type Path&lt;T&gt;</code> generates all valid dot-notation property paths for deep access typing (used in react-hook-form, zod, etc.).',
      ],
    },
    {
      heading: 'Intrinsic string manipulation types',
      points: [
        'TypeScript provides four intrinsic string manipulation types, implemented in the compiler itself: <code>Uppercase&lt;S&gt;</code>, <code>Lowercase&lt;S&gt;</code>, <code>Capitalize&lt;S&gt;</code>, <code>Uncapitalize&lt;S&gt;</code>.',
        'They operate on string literal types and distribute over unions: <code>Capitalize&lt;"hello" | "world"&gt;</code> → <code>"Hello" | "World"</code>.',
        'They only work on literal string types — <code>Capitalize&lt;string&gt;</code> is just <code>string</code> (the compiler cannot capitalize an unknown string at the type level).',
        'These are building blocks for the key remapping patterns above. They cannot be reproduced with pure TypeScript — they require compiler support because string manipulation at the type level requires access to character-level information.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Template Literal Types',
      language: 'typescript',
      code: `// Simple string type constraints
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiRoute = \`/api/\${string}\`;
type VersionedRoute = \`/v\${number}/\${string}\`;

function fetch(method: HttpMethod, route: ApiRoute): Promise<unknown> {
  return Promise.resolve(null);
}
fetch('GET', '/api/users');     // OK
// fetch('GET', '/users');      // Error — must start with /api/
// fetch('CONNECT', '/api/x');  // Error — CONNECT not in HttpMethod

// Cross-product from union members
type Side = 'top' | 'right' | 'bottom' | 'left';
type CssMargin = \`margin-\${Side}\`;
// 'margin-top' | 'margin-right' | 'margin-bottom' | 'margin-left'

type Axis = 'x' | 'y';
type Scale = '50' | '100' | '150';
type Transform = \`translate\${Uppercase<Axis>}(\${Scale}px)\`;
// 'translateX(50px)' | 'translateX(100px)' | ... 6 combinations

// BEM naming convention
type Block   = 'card' | 'button' | 'modal';
type Element = 'header' | 'body' | 'footer';
type Modifier = 'active' | 'disabled' | 'loading';
type BEM = \`\${Block}__\${Element}--\${Modifier}\`;
// All 3×3×3 = 27 valid BEM strings`,
    },
    {
      label: 'Event Handler Generation',
      language: 'typescript',
      code: `// Generate on-prefixed event handlers from event names
type DOMEvent = 'click' | 'focus' | 'blur' | 'keydown' | 'keyup' | 'mouseover';
type HandlerName = \`on\${Capitalize<DOMEvent>}\`;
// 'onClick' | 'onFocus' | 'onBlur' | 'onKeydown' | 'onKeyup' | 'onMouseover'

// Type-safe event listener registration
type EventHandlers = {
  [K in DOMEvent as \`on\${Capitalize<K>}\`]?: (event: Event) => void;
};

const handlers: EventHandlers = {
  onClick:     (e) => console.log('clicked', e),
  onFocus:     (e) => console.log('focused', e),
  // onInvalid: () => {} // Error — not a valid event
};

// Generic version — works with any string union
type Handlers<Events extends string> = {
  [K in Events as \`on\${Capitalize<K>}\`]?: (e: Event) => void;
};

// Angular-style output names
type OutputName<Prop extends string> = \`\${Prop}Change\`;
type NgOutputs = OutputName<'value' | 'checked' | 'selected'>;
// 'valueChange' | 'checkedChange' | 'selectedChange'`,
    },
    {
      label: 'Pattern Matching with infer',
      language: 'typescript',
      code: `// Extract prefix before underscore
type GetPrefix<T extends string> =
  T extends \`\${infer P}_\${string}\` ? P : T;
type A = GetPrefix<'user_id'>;    // 'user'
type B = GetPrefix<'name'>;       // 'name' (no underscore)

// Extract suffix after last dot
type GetExtension<T extends string> =
  T extends \`\${string}.\${infer Ext}\` ? GetExtension<Ext> : T;
type C = GetExtension<'app.module.ts'>; // 'ts'
type D = GetExtension<'README'>;        // 'README'

// Split camelCase (simplified — for illustration)
type SplitOnUpper<T extends string> =
  T extends \`\${infer Head}\${Uppercase<infer Tail>}\`
    ? \`\${Head} \${SplitOnUpper<Tail>}\`
    : T;

// Parse dot-path type
type ParsePath<T extends string> =
  T extends \`\${infer Head}.\${infer Tail}\`
    ? [Head, ...ParsePath<Tail>]
    : [T];
type E = ParsePath<'user.profile.name'>; // ['user', 'profile', 'name']
type F = ParsePath<'id'>;               // ['id']

// Check if string starts with prefix
type StartsWith<T extends string, Prefix extends string> =
  T extends \`\${Prefix}\${string}\` ? true : false;
type G = StartsWith<'onClick', 'on'>; // true
type H = StartsWith<'name', 'on'>;    // false`,
    },
    {
      label: 'Typed Object Paths',
      language: 'typescript',
      code: `// Deep object path type — as used in react-hook-form, zod, lodash types
type DotPath<T> = T extends object
  ? { [K in keyof T & string]:
      K | (T[K] extends object ? \`\${K}.\${DotPath<T[K]>}\` : never)
    }[keyof T & string]
  : never;

interface Settings {
  user: { name: string; email: string; address: { city: string; zip: string } };
  app: { theme: 'light' | 'dark'; language: string };
}
type SettingsPath = DotPath<Settings>;
// 'user' | 'app' | 'user.name' | 'user.email' | 'user.address'
// | 'user.address.city' | 'user.address.zip' | 'app.theme' | 'app.language'

// Get the value type at a path
type PathValue<T, P extends string> =
  P extends \`\${infer K}.\${infer Rest}\`
    ? K extends keyof T
      ? PathValue<T[K], Rest>
      : never
    : P extends keyof T
    ? T[P]
    : never;

type CityType = PathValue<Settings, 'user.address.city'>; // string
type ThemeType = PathValue<Settings, 'app.theme'>;         // 'light' | 'dark'

// Type-safe deep get
function getPath<T, P extends DotPath<T> & string>(obj: T, path: P): PathValue<T, P> {
  return path.split('.').reduce((acc: unknown, key) => (acc as any)[key], obj) as PathValue<T, P>;
}`,
    },
    {
      label: 'Getters, Setters & API Types',
      language: 'typescript',
      code: `// Auto-generate getter + setter interface
type WithGetters<T> = T & {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
type WithSetters<T> = T & {
  [K in keyof T as \`set\${Capitalize<string & K>}\`]: (val: T[K]) => void;
};
type Observable<T> = WithGetters<T> & WithSetters<T>;

interface Point { x: number; y: number }
type ObservablePoint = Observable<Point>;
// { x: number; y: number; getX(): number; getY(): number; setX(val: number): void; setY(val: number): void }

// Type-safe SQL table references
type TableName = 'users' | 'posts' | 'comments';
type SelectQuery = \`SELECT * FROM \${TableName}\`;
type InsertQuery = \`INSERT INTO \${TableName}\`;

function query(sql: SelectQuery | InsertQuery): Promise<unknown[]> {
  return Promise.resolve([]);
}
query('SELECT * FROM users');   // OK
// query('SELECT * FROM orders'); // Error — 'orders' not in TableName

// CSS variable naming
type CSSVar<T extends string> = \`--\${Lowercase<T>}\`;
type Tokens = CSSVar<'Primary' | 'Secondary' | 'Accent'>;
// '--primary' | '--secondary' | '--accent'

function setCSSVar(name: Tokens, value: string): void {
  document.documentElement.style.setProperty(name, value);
}
setCSSVar('--primary', '#3178c6'); // OK`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting `string & K` when using Capitalize with keyof',
      wrong: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<K>}\`]: () => T[K];
  // Error: Type 'K' does not satisfy the constraint 'string'
};`,
      right: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
  // string & K narrows to only string keys — excludes symbol and number
};`,
      explanation: 'keyof T can return string | number | symbol. Capitalize only accepts string. Use string & K to intersect and filter out non-string keys before passing to Capitalize.',
    },
    {
      title: 'Using template literal types with non-literal `string` — produces just `string`',
      wrong: `type Prefix<T extends string> = \`prefix_\${T}\`;
type A = Prefix<string>; // string — NOT 'prefix_' + something useful
// There is no useful computation when T is the broad 'string' type`,
      right: `// Template literal types are most useful with literal unions
type Prefix<T extends 'foo' | 'bar' | 'baz'> = \`prefix_\${T}\`;
type A = Prefix<'foo' | 'bar'>; // 'prefix_foo' | 'prefix_bar'

// Or use the broad string form only for runtime validation, not type computation
type AnyPrefixed = \`prefix_\${string}\`; // accepts any string starting with 'prefix_'`,
      explanation: 'Template literal type computation only produces useful specific types when the embedded type is a string literal or a union of string literals. With the broad string type, the result is just string — no narrower type is generated.',
    },
    {
      title: 'Pattern match not accounting for exact vs prefix matches',
      wrong: `type GetPrefix<T extends string> = T extends \`\${infer P}_\${string}\` ? P : never;
type A = GetPrefix<'user_profile_name'>; // 'user' — greedy? No — leftmost match
// Actually returns 'user' — the infer matches the shortest prefix`,
      right: `// To get the LAST segment after all underscores, use recursion
type LastSegment<T extends string> =
  T extends \`\${string}_\${infer Rest}\`
    ? LastSegment<Rest>
    : T;
type A = LastSegment<'user_profile_name'>; // 'name'
type B = LastSegment<'user'>;              // 'user'`,
      explanation: 'The infer pattern in template literal types uses greedy matching from the left — ${infer P}_${string} binds the shortest possible prefix to P. For the last segment, recursively match until no more underscores exist.',
    },
    {
      title: 'Generating excessively large union types — performance issues',
      wrong: `// 26 * 26 * 26 = 17,576 combinations — TypeScript slows to a crawl
type Letter = 'a'|'b'|'c'|...|'z'; // 26 members
type ThreeLetter = \`\${Letter}\${Letter}\${Letter}\`; // 17,576 string literals!`,
      right: `// Keep template literal unions small — prefer semantic names
type Color = 'red' | 'green' | 'blue';
type Shade = '100' | '200' | '500' | '900';
type ColorToken = \`\${Color}-\${Shade}\`; // 12 combinations — fine`,
      explanation: 'Template literal types with multiple large union slots create the cross-product of all combinations. With 3 slots of 26 letters, that is 17,576 types. TypeScript must track all of them — this causes serious type-checking slowdowns.',
    },
    {
      title: 'Expecting runtime string manipulation from type-level types',
      wrong: `type Upper<T extends string> = Uppercase<T>;
// This is a TYPE — it does not uppercase strings at runtime!
const s = 'hello';
const u: Upper<typeof s> = s; // still 'hello' at runtime — just typed as 'HELLO'`,
      right: `// For runtime: use JavaScript string methods
const s = 'hello';
const u = s.toUpperCase(); // 'HELLO' at runtime

// For type-level only (validate API response keys, etc.):
type UpperKey<T extends string> = Uppercase<T>; // only changes the type`,
      explanation: 'Uppercase<T>, Capitalize<T>, etc. are compile-time type transformations — they only affect what TypeScript believes the type is. They do not transform any runtime values. Use .toUpperCase(), .toLowerCase() for actual string manipulation.',
    },
    {
      title: 'Using template literal types where a simple union is clearer',
      wrong: `// Overly complex template literal for a fixed set of values
type Direction = \`\${"north"|"south"}\${"east"|"west"|""}\`;
// 'northeast' | 'northwest' | 'north' | 'southeast' | 'southwest' | 'south'
// The empty string case is hard to reason about`,
      right: `// Simple explicit union — clearer intent and easier to maintain
type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';`,
      explanation: 'Template literal types shine when generating many systematic combinations (getter names, event handlers, CSS variables). For small fixed sets, a plain union is clearer and does not risk generating unintended combinations like the empty-string case above.',
    },
  ];

  challenge: Challenge = {
    title: 'Type-safe CSS-in-JS variable system',
    language: 'typescript',
    description: 'Build a typed CSS variable system. Define a theme object with color, spacing, and font tokens. Create a CSSVarName<T> type that generates "--color-primary", "--spacing-sm", etc. from the theme structure. Implement a typedVar(path) function that returns the CSS variable reference string ("var(--color-primary)") with full type safety on the path argument.',
    hints: [
      'Theme keys map to token names: { color: { primary: string } } → "--color-primary"',
      'Use a recursive type similar to DotPath but replacing dots with hyphens and adding the -- prefix',
      'CSSVarName<T> = `--${Lowercase<section>}-${Lowercase<token>}` from keyof T',
      'typedVar(name: CSSVarName<Theme>) returns `var(${name})` typed as `var(${CSSVarName<Theme>})`',
    ],
    starterCode: `const theme = {
  color:   { primary: '#3178c6', secondary: '#1d4ed8', accent: '#93c5fd' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
  font:    { sans: 'Inter', mono: 'JetBrains Mono', size: '16px' },
} as const;

type Theme = typeof theme;

// TODO: define CSSVarName<T> — generates '--color-primary', '--spacing-sm' etc.
// TODO: implement typedVar(name: CSSVarName<Theme>): string

const primary = typedVar('--color-primary');
// primary: "var(--color-primary)"

// typedVar('--color-unknown'); // should error
// typedVar('--spacing-xl');    // should error — xl not in theme`,
    solution: `const theme = {
  color:   { primary: '#3178c6', secondary: '#1d4ed8', accent: '#93c5fd' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
  font:    { sans: 'Inter', mono: 'JetBrains Mono', size: '16px' },
} as const;

type Theme = typeof theme;

// Generate all CSS variable names from theme structure
type CSSVarName<T> = {
  [Section in keyof T & string]: {
    [Token in keyof T[Section] & string]: \`--\${Lowercase<Section>}-\${Lowercase<Token>}\`
  }[keyof T[Section] & string]
}[keyof T & string];

type ThemeVar = CSSVarName<Theme>;
// '--color-primary' | '--color-secondary' | '--color-accent'
// | '--spacing-xs' | '--spacing-sm' | '--spacing-md' | '--spacing-lg'
// | '--font-sans' | '--font-mono' | '--font-size'

type CSSVarRef = \`var(\${ThemeVar})\`;

function typedVar(name: ThemeVar): CSSVarRef {
  return \`var(\${name})\`;
}

// Usage
const primary = typedVar('--color-primary');   // "var(--color-primary)"
const spacing  = typedVar('--spacing-md');     // "var(--spacing-md)"
// typedVar('--color-unknown'); // Error — not in theme
// typedVar('--spacing-xl');    // Error — xl not in theme

// Generate CSS custom property declarations
function generateCSS(theme: Theme): string {
  return Object.entries(theme)
    .flatMap(([section, tokens]) =>
      Object.entries(tokens).map(([token, value]) =>
        \`  --\${section}-\${token}: \${value};\`
      )
    )
    .join('\\n');
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `` type T = `${"a" | "b"}${"1" | "2"}` `` produce?',
      options: [
        '"a1" | "b2"',
        '"ab" | "12"',
        '"a1" | "a2" | "b1" | "b2"',
        '"a" | "b" | "1" | "2"',
      ],
      answer: 2,
      explanation: 'Template literal types produce the cross-product of all union combinations. Each slot distributes independently, giving all 2×2 = 4 combinations.',
    },
    {
      q: 'Why is `string & K` needed when using `Capitalize<K>` in a mapped type?',
      options: [
        'To make K optional',
        'keyof T can include number and symbol keys — Capitalize requires string; the intersection filters to string keys only',
        'To prevent infinite recursion',
        'string & K converts K from a union to a single type',
      ],
      answer: 1,
      explanation: 'keyof T returns string | number | symbol keys. Capitalize<T> only accepts string. Without string & K, TypeScript errors because K might be a number or symbol. The intersection filters K to only its string members.',
    },
    {
      q: 'What does `Capitalize<string>` produce?',
      options: [
        'string — the broad string type (Capitalize cannot capitalize an unknown string)',
        '"A" | "B" | ... — all capitalized single-letter strings',
        'Capitalize<string> is an error — only literal strings are accepted',
        'never',
      ],
      answer: 0,
      explanation: 'Capitalize only produces useful narrow types when given a string literal or a union of string literals. With the broad string type, it returns string — no capitalization happens at the type level.',
    },
    {
      q: 'What does `T extends \\`${infer Head}.${infer Tail}\\`` do?',
      options: [
        'Checks if T contains a dot',
        'Splits T at the first dot, binding the left part to Head and the right part to Tail',
        'Splits T at every dot and returns an array',
        'Removes dots from the string type T',
      ],
      answer: 1,
      explanation: 'This is a template literal type pattern match. If T matches the pattern (a string with at least one dot), Head is bound to the substring before the first dot and Tail to everything after it.',
    },
    {
      q: 'What is the risk of template literal types with many large union slots?',
      options: [
        'Runtime performance degrades',
        'TypeScript generates incorrect types',
        'The cross-product of all combinations can be enormous — TypeScript slows significantly with thousands of string literal types',
        'infer stops working inside large template literal types',
      ],
      answer: 2,
      explanation: 'Template literal types compute the full cross-product of all union slots. Three slots with 26 letters each gives 17,576 string literal types. TypeScript must track all of them, causing severe type-checking slowdowns.',
    },
    {
      q: 'Does `Uppercase<"hello">` transform the string at runtime?',
      options: [
        'Yes — TypeScript instruments the JavaScript output to uppercase the string',
        'No — it is a compile-time type transformation only; the runtime value is still "hello"',
        'Only if the string is a const',
        'Only in strict mode',
      ],
      answer: 1,
      explanation: 'Uppercase<T>, Lowercase<T>, Capitalize<T>, Uncapitalize<T> are type-level transformations only. They change what TypeScript believes the type to be but emit no JavaScript. The runtime value is unaffected.',
    },
    {
      q: 'When are template literal types most useful compared to a plain string union?',
      options: [
        'Always — template literals are more efficient',
        'When you have a large systematic set of combinations to generate (event handlers, CSS variables, API routes)',
        'When the strings contain spaces',
        'Only in generic functions, not type aliases',
      ],
      answer: 1,
      explanation: 'Template literal types excel when generating many systematic string combinations from small building blocks — event handler names, typed CSS variables, API route patterns. For small fixed sets, a plain union is simpler and easier to read.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a template literal type and a tagged template literal?',
      a: 'A template literal TYPE is a TypeScript construct that describes a string type: `prefix_${string}`. It exists only at compile time. A tagged template literal is a JavaScript runtime feature: sql`SELECT * FROM ${table}`. They use the same backtick syntax but are completely different — one is type-level, the other is runtime. TypeScript can TYPE a tagged template literal using template literal types.',
    },
    {
      q: 'Can I use template literal types to validate email addresses or other patterns?',
      a: 'Partially. You can express constraints like `${string}@${string}.${string}` which catches obvious non-emails (no @ or .) but TypeScript cannot model complex regex patterns at the type level. For thorough validation, use a runtime validator (Zod, class-validator) that also produces a TypeScript type via z.infer.',
    },
    {
      q: 'How do template literal types work in combination with mapped types?',
      a: 'Template literal types are most commonly used in the key remapping clause of mapped types: [K in keyof T as `get${Capitalize<string & K>}`]. This renames every key K to "get" + capitalized(K). The result is a new type with getter method names derived from the property names of T.',
    },
    {
      q: 'What happens when I use infer inside a template literal type pattern?',
      a: 'TypeScript matches the template pattern against the concrete string type and binds the infer variable to the matching substring. `T extends \\`${infer P}.${infer R}\\`` matches any string with a dot, binding the left part to P and the right to R. If T does not match the pattern, the conditional resolves to the false branch.',
    },
    {
      q: 'Are template literal types supported in older TypeScript versions?',
      a: 'Template literal types were added in TypeScript 4.1 (November 2020). Key remapping with `as` in mapped types was also added in 4.1. Intrinsic string manipulation types (Uppercase, Lowercase, Capitalize, Uncapitalize) were added at the same time. Any project on TypeScript 4.1+ supports all these features.',
    },
    {
      q: 'How do frameworks like Angular and React use template literal types?',
      a: 'Angular uses them for signal input/output typing and for the `[class.name]` binding types. React uses them in event handler typing (`on${Capitalize<EventName>}`), CSS property types, and the `data-*` attribute pattern (`data-${string}`). TypeScript itself uses them in the `addEventListener` overloads to type event handler parameters correctly by event name.',
    },
    {
      q: 'How do I generate type-safe deep object paths like react-hook-form uses?',
      a: 'Use a recursive DotPath<T> type that for each string key K of T, outputs K and (if T[K] is an object) also `${K}.${DotPath<T[K]>}`. Combine with PathValue<T, P> to get the type at a given path using infer-based splitting. This pattern is computationally expensive for deeply nested large types — limit depth with a depth counter if needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Template literal types build string literal types by concatenation — `${A}${B}` creates all combinations, pattern matching with infer extracts substrings, and key remapping with Capitalize generates method names from property names.',
    mustKnow: [
      '`${"a"|"b"}${"1"|"2"}` produces the cross-product: "a1" | "a2" | "b1" | "b2"',
      'string & K is required when passing keyof T to Capitalize — keyof includes symbol/number',
      'Uppercase/Capitalize are compile-time type transformations — they do NOT change runtime values',
      'T extends `${infer Head}.${infer Tail}` splits at the first dot — use recursion for all segments',
      'Large union cross-products (3 slots × 26 letters) can severely slow TypeScript — keep unions small',
      'Template literal types are most useful for systematic name generation (getters, events, CSS vars)',
      'Intrinsic string types were added in TypeScript 4.1 — requires 4.1+ to use',
    ],
    interviewFocus: [
      'What does a template literal type like `` `on${Capitalize<E>}` `` produce?',
      'Why is `string & K` needed in mapped type key remapping with Capitalize?',
      'How do you use infer inside a template literal type for pattern matching?',
      'What are the four intrinsic string manipulation types and what do they do?',
      'When would template literal types cause TypeScript performance problems?',
    ],
  };
}
