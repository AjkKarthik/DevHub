import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-forgetting-as-const-collapses-color-union-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-forgetting-as-const-collapses-the-color-union-to-string.html',
  styleUrl: './testing-that-forgetting-as-const-collapses-the-color-union-to-string.scss',
})
export class TestingThatForgettingAsConstCollapsesTheColorUnionToStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fix Leans on a Single Easy-to-Drop Keyword',
      points: [
        'The "Complex type performance issues" code tab shows a 100-member string literal union slowing the language server, then offers this fix: <code>const COLORS = [\'red\', \'blue\', \'green\'] as const; type Color = typeof COLORS[number]; // same safety, less TypeScript work</code>',
        'The comment says "same safety" — implying the resulting <code>Color</code> type is exactly as narrow and safe as the 100-member union it replaces. But that guarantee rests entirely on one small keyword: <code>as const</code>. What happens if a later refactor drops it, since the array itself still looks completely reasonable without it?',
      ],
    },
    {
      heading: 'Why typeof COLORS[number] Needs as const to Stay Narrow',
      points: [
        'Without <code>as const</code>, TypeScript infers array literals at their WIDENED element type. <code>[\'red\', \'blue\', \'green\']</code> alone infers as <code>string[]</code> — because a plain array is assumed to be mutable, and <code>colors.push(\'purple\')</code> should stay legal, so each element widens to plain <code>string</code>.',
        '<code>typeof COLORS[number]</code> then reads out that array\'s ELEMENT type. With <code>as const</code>, the element type is the literal union <code>\'red\' | \'blue\' | \'green\'</code>. Without it, the element type is just <code>string</code> — <code>Color</code> silently becomes an alias for <code>string</code>, accepting literally any string value.',
        'The code still compiles either way, with no error at the point <code>as const</code> was dropped — the resulting <code>Color</code> type is just quietly weaker. The whole safety guarantee the pattern was adopted for (rejecting a typo like <code>\'purpel\'</code>) disappears without a trace.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>as const and the color union</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own fix, exactly as written -- WITH as const:
const COLORS_SAFE = ['red', 'blue', 'green'] as const;
type ColorSafe = typeof COLORS_SAFE[number]; // 'red' | 'blue' | 'green'

function paintSafe(c: ColorSafe) {
  console.log('painting', c);
}
paintSafe('red');   // fine -- a real member of the union
// paintSafe('purple'); // Uncomment -- does this reject the typo, as promised?

// The exact same pattern, MINUS as const -- an easy accidental refactor:
const COLORS_UNSAFE = ['red', 'blue', 'green'];
type ColorUnsafe = typeof COLORS_UNSAFE[number]; // what type is this now?

function paintUnsafe(c: ColorUnsafe) {
  console.log('painting', c);
}
paintUnsafe('red');    // still fine
paintUnsafe('purple'); // does this ALSO compile, despite not being a real color?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `paintSafe(\'purple\')` and confirm it is rejected. Then compare `paintUnsafe(\'purple\')`, which is already active — does it compile? Hover `ColorUnsafe` to see what it actually resolved to.',
    hint: 'A plain array literal without `as const` infers each element at its widened type — for string literals, that widened type is plain `string`, not the narrow literal.',
    solution: `paintSafe('purple') fails to compile: "Argument of type '\\"purple\\"'
is not assignable to parameter of type 'ColorSafe'." -- exactly the
safety the main page's fix promises.

paintUnsafe('purple') compiles with ZERO errors. Hovering ColorUnsafe
shows it resolved to plain string, not a union of three literals --
because COLORS_UNSAFE itself was inferred as string[], and indexing a
string[] by [number] just gives back string.

The practical lesson: "same safety, less TypeScript work" is only true
as long as as const stays attached to the array. It is a single,
easy-to-drop keyword with no compiler warning if it's ever removed
(during a refactor, a copy-paste into a new file, or a well-meaning
"cleanup" of what looks like a redundant cast) -- the resulting type
silently downgrades from a real safety net to a no-op alias for string,
and every call site that relied on it loses its typo protection with
no error anywhere.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`const COLORS = [\'red\', \'blue\', \'green\']` and `const COLORS = [\'red\', \'blue\', \'green\'] as const` produce the same type for `typeof COLORS[number]` — `as const` is just a stylistic addition for readonly-ness, not something that changes the union\'s members.',
      reality: 'without `as const`, the array infers as `string[]` and `typeof COLORS[number]` resolves to plain `string` — the entire literal-union safety net the main page\'s fix depends on comes specifically from that one keyword, not from the array literal itself.',
    },
    {
      thought: 'if `ColorUnsafe` silently became `string` after dropping `as const`, some later type error would eventually surface and catch the mistake.',
      reality: 'a type that widened to `string` accepts literally any string value everywhere it\'s used — there is no future point where TypeScript would flag this, since from its perspective nothing is wrong; the safety gap is permanent and silent until a real bad value reaches runtime.',
    },
    {
      thought: 'the main page\'s comment "same safety, less TypeScript work" is an unconditional property of the `typeof COLORS[number]` pattern.',
      reality: 'it is conditional on `as const` being present — remove it and the pattern keeps compiling, keeps looking correct, and keeps being referenced as "the type-safe colors list" while actually providing no safety at all.',
    },
  ];
}
