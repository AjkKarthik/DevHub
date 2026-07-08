import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-as-cast-defeats-cssvarname-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-single-as-cast-defeats-the-cssvarname-cross-product.html',
  styleUrl: './testing-that-a-single-as-cast-defeats-the-cssvarname-cross-product.scss',
})
export class TestingThatASingleAsCastDefeatsTheCssvarnameCrossProductSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Elaborate Type Machinery',
      points: [
        'The challenge solution builds a genuinely sophisticated <code>CSSVarName&lt;T&gt;</code> — a nested mapped type with template literal remapping that computes exactly nine valid CSS variable names from the theme structure, then a <code>typedVar(name: ThemeVar): CSSVarRef</code> function that only accepts those nine strings.',
        'The comments even show the payoff: <code>typedVar(\'--color-unknown\')</code> and <code>typedVar(\'--spacing-xl\')</code> are both correctly flagged as compile errors. This subtopic tests what happens when a caller reaches for a single, ordinary type assertion instead of a genuinely valid theme token.',
      ],
    },
    {
      heading: 'Why One as Cast Undoes the Whole Cross-Product',
      points: [
        'The main page\'s OWN separate Common Mistake #5 states generally that type-level transformations "do NOT change runtime values" and are compile-time only. Applied specifically here: <code>typedVar(\'--color-unknown\' as ThemeVar)</code> compiles cleanly — the <code>as</code> assertion tells TypeScript "trust me, this string genuinely is one of the nine valid tokens," with zero verification performed.',
        '<code>typedVar</code>\'s implementation is just <code>return \`var(${name})\`;</code> — a plain string interpolation with no runtime lookup against the actual <code>theme</code> object. Every safeguard the elaborate <code>CSSVarName&lt;T&gt;</code> type provides exists ONLY at compile time; a single cast at any call site bypasses every layer of that machinery at once, silently.',
        'This is not a flaw specific to this challenge\'s design — it is a structural property of ALL compile-time-only type safety in TypeScript, already flagged generally on this page. The point worth internalizing here is how CHEAP it is to defeat: a nine-way cross-product built from three separate token categories collapses to nothing more than "trust me" with a single keyword at one call site.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Type assertions and CSSVarName</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The challenge's own theme and CSSVarName machinery, unchanged
const theme = {
  color:   { primary: '#3178c6', secondary: '#1d4ed8', accent: '#93c5fd' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
  font:    { sans: 'Inter', mono: 'JetBrains Mono', size: '16px' },
} as const;

type Theme = typeof theme;

type CSSVarName<T> = {
  [Section in keyof T & string]: {
    [Token in keyof T[Section] & string]: \`--\${Lowercase<Section>}-\${Lowercase<Token>}\`
  }[keyof T[Section] & string]
}[keyof T & string];

type ThemeVar = CSSVarName<Theme>;
type CSSVarRef = \`var(\${ThemeVar})\`;

function typedVar(name: ThemeVar): CSSVarRef {
  return \`var(\${name})\`;
}

// The challenge's own documented behavior -- correctly rejected
// typedVar('--color-unknown'); // Error, as the main page's comment shows

// Bypassing all nine valid-token checking with a single assertion
const fake = typedVar('--color-unknown' as ThemeVar);
console.log('fake CSS var reference, fully compiled with no errors:', fake);

// Confirm typedVar performs NO runtime validation against the real theme object
function isRealToken(varRef: string): boolean {
  const flatTokens = Object.entries(theme).flatMap(([section, tokens]) =>
    Object.keys(tokens).map(token => \`--\${section}-\${token}\`)
  );
  return flatTokens.some(t => varRef.includes(t));
}
console.log('Is the "fake" var reference actually a real theme token?', isRealToken(fake));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Predict the output of `isRealToken(fake)` before running the demo. Then explain what would need to change in typedVar\'s IMPLEMENTATION (not its type signature) to make it actually reject \'--color-unknown\' at runtime, not just at compile time.',
    hint: 'The elaborate CSSVarName<T> type only ever influences what the COMPILER checks — the function body itself never looks at the theme object at all.',
    solution: `isRealToken(fake) logs false -- confirming '--color-unknown' is not
one of the nine real tokens generated from the theme object, even
though typedVar('--color-unknown' as ThemeVar) compiled without a
single error.

To make typedVar reject this at RUNTIME too, its implementation
would need an actual runtime check against the theme structure --
e.g., building the same flattened token list isRealToken() computes
above and throwing if the requested name isn't in it. The type
system and the runtime are two entirely separate layers of
enforcement; CSSVarName<T> only strengthens the FIRST one. Whenever
external, potentially-untrusted string values flow into a
type-only-checked function (user input, data from an API, a value
threaded through several as casts), the elaborate compile-time
type provides zero actual protection.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the challenge\'s elaborate `CSSVarName<T>` cross-product type, once built, makes `typedVar` genuinely safe against any invalid CSS variable name reaching it, in any circumstance.',
      reality: 'a single `as ThemeVar` assertion at any call site bypasses the ENTIRE compile-time check at once — the protection `CSSVarName<T>` provides exists only for callers who never use a type assertion to work around it.',
    },
    {
      thought: 'since `typedVar\'s\' return type is built from the real `theme` object\'s structure (via `typeof theme`), the function must perform some actual lookup against that object at runtime.',
      reality: '`typedVar`\'s implementation is pure string interpolation (`` `var(${name})` ``) — it never reads from `theme` at runtime at all; the connection to the real theme structure exists only in the TYPE, computed once at compile time.',
    },
    {
      thought: 'this gap is specific to a poorly-designed challenge solution and could be avoided with a "better" type-level implementation.',
      reality: 'no amount of additional type-level sophistication closes this gap — TypeScript types are fundamentally erased before the code runs, so any type-only safeguard is defeatable by a single assertion at any call site, by design, not by implementation quality.',
    },
  ];
}
