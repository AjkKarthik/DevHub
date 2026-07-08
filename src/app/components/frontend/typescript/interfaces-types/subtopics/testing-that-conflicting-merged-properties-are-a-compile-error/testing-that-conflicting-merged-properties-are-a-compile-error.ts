import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-conflicting-merge-compile-error-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-conflicting-merged-properties-are-a-compile-error.html',
  styleUrl: './testing-that-conflicting-merged-properties-are-a-compile-error.scss',
})
export class TestingThatConflictingMergedPropertiesAreACompileErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Describes Merging as Unconditional',
      points: [
        'The "Declaration Merging" theory section states: "When two interfaces share the same name in the same scope, TypeScript merges them into one type with all their properties combined." No condition, caveat, or failure case is mentioned — it reads as if any two same-named interfaces always successfully combine.',
        'This holds for DISJOINT or IDENTICAL property sets (the main page\'s own examples: <code>Window</code> gaining a brand-new <code>myPlugin</code> property, <code>DocumentEventMap</code> gaining a new event key) — but it does not hold when both declarations define the SAME property name with two genuinely different, incompatible types.',
      ],
    },
    {
      heading: 'What Actually Happens on a Genuine Conflict',
      points: [
        'If two interface declarations with the same name both declare a property with the same name but different, non-identical types (e.g. one says <code>version: string</code>, the other says <code>version: number</code>), TypeScript does NOT silently pick one, union them, or let the last declaration win — it reports a compile error at the SECOND declaration: "Subsequent property declarations must have the same type. Property \'version\' must be of type X, but here has type Y."',
        'This is a genuinely useful thing to know before relying on declaration merging for module augmentation across a larger codebase — if two different files both augment the same interface with a property of the same name, TypeScript actively protects you from a silent type conflict, rather than letting whichever file compiles last silently win.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Conflicting declaration merge</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// ── The main page's own successful merge example (for contrast) ────────────
interface Config { host: string }
interface Config { port: number }   // disjoint property -- merges fine
const cfg: Config = { host: 'localhost', port: 3000 };
console.log(cfg);

// ── Testing the theory's unconditional "merges them... combined" claim ──────
interface Plugin { version: string }
// interface Plugin { version: number }
// uncomment above: ERROR --
// "Subsequent property declarations must have the same type.
//  Property 'version' must be of type 'string', but here has type 'number'."
//
// TypeScript does NOT silently pick one type, union them into
// 'string | number', or let the second declaration win -- it
// refuses to compile at all, precisely because "merges them...
// combined" (the main page's own phrasing) has no well-defined
// meaning when the same property name means two incompatible things.

// ── Identical (not just compatible) types DO merge fine, though ─────────────
interface SameType { id: string }
interface SameType { id: string }   // exact duplicate type -- no conflict
const s: SameType = { id: 'ok' };
console.log(s);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the second `interface Plugin { version: number }` declaration in the playground above. Read the exact error. Then change it to `interface Plugin { version: string }` (matching the first declaration exactly). Does it compile now?',
    hint: 'Compare a property with a genuinely DIFFERENT type across the two declarations against a property with the IDENTICAL type repeated — TypeScript treats these differently.',
    solution: `With version: number in the second declaration (conflicting with
the first declaration's version: string), TypeScript reports:
"Subsequent property declarations must have the same type. Property
'version' must be of type 'string', but here has type 'number'." The
file fails to compile at all -- not a warning, not a silent
resolution, a hard error.

Changing the second declaration to version: string (matching the
first EXACTLY) compiles cleanly, exactly like the SameType example
at the bottom of the playground -- declaration merging tolerates a
property being repeated with the identical type across multiple
interface declarations, but never tolerates two different types for
the same property name. This is the boundary the main page's
unqualified "merges them into one type with all their properties
combined" doesn't mention.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'declaration merging always succeeds when two interfaces share a name — TypeScript just combines whatever properties each declaration lists.',
      reality: 'merging only succeeds when overlapping property names have the SAME type across every declaration — a genuine type conflict on a shared property name is a compile error, not a silent combination.',
    },
    {
      thought: 'if two same-named interfaces conflict on a property, TypeScript resolves it the way JavaScript object spread would — the LAST declaration wins.',
      reality: 'TypeScript does not pick a "winner" at all for a genuine type conflict — it refuses to compile, specifically to prevent the kind of silent, order-dependent behavior that spread-based resolution would introduce.',
    },
    {
      thought: 'declaration merging across multiple files (e.g., two different modules both augmenting the same global interface) is inherently risky, since there\'s no way to know if they\'ll conflict until something breaks at runtime.',
      reality: 'the opposite is true — a genuine type conflict between two augmentations of the same interface is caught at COMPILE time, as a clear, specific error naming the conflicting property and both types, well before anything could reach runtime.',
    },
  ];
}
