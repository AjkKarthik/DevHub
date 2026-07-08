import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dotpath-infinite-recursion-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-dotpath-hits-infinite-recursion-on-self-reference.html',
  styleUrl: './testing-that-dotpath-hits-infinite-recursion-on-self-reference.scss',
})
export class TestingThatDotpathHitsInfiniteRecursionOnSelfReferenceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s DotPath, Tried on a Different Shape',
      points: [
        'The Typed Object Paths tab defines a recursive <code>DotPath&lt;T&gt;</code> and demonstrates it on <code>Settings</code>, a type with FINITE nesting (no property\'s type ever refers back to an ancestor type). The QnA even notes the pattern "is computationally expensive for deeply nested large types," but only discusses depth, not self-reference.',
        'This subtopic tests <code>DotPath&lt;T&gt;</code> on a genuinely SELF-REFERENCING interface — a linked structure where a property\'s type is (or contains) the interface itself, like a category with an optional parent category of the same type.',
      ],
    },
    {
      heading: 'Why Self-Reference Breaks Recursive Type Computation',
      points: [
        '<code>DotPath&lt;T&gt;</code> recurses into <code>DotPath&lt;T[K]&gt;</code> whenever <code>T[K] extends object</code>. For an interface like <code>interface Category { name: string; children: Category[] }</code>, the <code>children</code> property\'s element type IS <code>Category</code> itself — recursing into it produces another <code>DotPath&lt;Category&gt;</code> call, which again encounters <code>children: Category[]</code>, and so on with no natural termination.',
        'TypeScript enforces a maximum type-instantiation depth as a safety net. When a recursive conditional or mapped type genuinely has no base case for a given input, the compiler eventually gives up with <code>error TS2589: Type instantiation is excessively deep and possibly infinite.</code> — a compile error, not a silent wrong answer or a runtime crash.',
        'This is a well-known, common real-world TypeScript error, not specific to <code>DotPath</code> — ANY recursive conditional/mapped type applied to a self-referencing or mutually-referencing set of interfaces (tree nodes, linked lists, GraphQL-style schemas with circular relations) hits the same wall unless the recursion includes an explicit depth limit or excludes the self-referencing property.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>DotPath and self-referencing types</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own DotPath<T>, unchanged
type DotPath<T> = T extends object
  ? { [K in keyof T & string]:
      K | (T[K] extends object ? \`\${K}.\${DotPath<T[K]>}\` : never)
    }[keyof T & string]
  : never;

// The main page's own Settings example -- works fine, finite nesting
interface Settings {
  user: { name: string; email: string; address: { city: string; zip: string } };
  app: { theme: 'light' | 'dark'; language: string };
}
type SettingsPath = DotPath<Settings>; // compiles fine

// A self-referencing type -- a required (non-optional) reference back
// to the SAME interface, forming a genuinely infinite structure
interface Category {
  name: string;
  children: Category[]; // required -- refers back to Category itself
}

// Does this compile, or does TypeScript hit its recursion depth limit?
type CategoryPath = DotPath<Category>;
// If you see this comment survive a real build, TypeScript resolved
// it -- but watch the StackBlitz Problems/Console panel for:
// "Type instantiation is excessively deep and possibly infinite. ts(2589)"

console.log('If the build above did not fail, check the editor for red squiggles on CategoryPath.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Look at the `type CategoryPath = DotPath<Category>;` line in the StackBlitz editor. Does TypeScript show a red squiggle / error on it? What is the exact error code and message?',
    hint: 'children: Category[] means DotPath recurses into DotPath<Category> again from inside the definition of DotPath<Category> itself, with no property that ever stops referring back to Category.',
    solution: `TypeScript flags CategoryPath with: "Type instantiation is
excessively deep and possibly infinite. ts(2589)" -- the compiler's
built-in recursion depth limit is what actually stops this, not a
graceful "detect the cycle and terminate" mechanism. DotPath itself
has no explicit base case for self-reference; it only terminates
naturally when a property's type eventually stops being an object.

This is NOT specific to a bug in the page's DotPath implementation
-- virtually any hand-written recursive conditional/mapped type
(the same category of code as DeepReadonly, DeepPartial, and this
page's own PathValue) will hit the identical error on a
self-referencing or mutually-referencing set of interfaces.

The fix pattern (not shown on the main page) is to add an explicit
depth counter parameter that decrements each recursive call and
bails out to a simple result once it reaches zero, or to explicitly
exclude self-referencing property types from the recursive branch.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s `DotPath<T>` recursive type will work correctly (if slowly) on ANY object type, since the QnA only warns about performance for "deeply nested large types," not about failure.',
      reality: 'a genuinely self-referencing interface (a property whose type refers back to an ancestor type) causes `DotPath<T>` to recurse with NO base case at all, producing a hard compile error (`ts2589`), not just a slow-but-successful computation.',
    },
    {
      thought: 'TypeScript detects a self-referencing type cycle and gracefully handles it, perhaps by resolving the recursive part to some sentinel type.',
      reality: 'TypeScript has no cycle-detection for this — it simply enforces a maximum type-instantiation depth as a safety net and reports an error once that ceiling is hit, regardless of whether the underlying structure is genuinely infinite or just very deep.',
    },
    {
      thought: 'this failure mode is unique to `DotPath` and does not affect the page\'s other recursive utilities, like `PathValue` or the challenge\'s `CSSVarName`.',
      reality: 'the same risk applies to ANY hand-written recursive conditional or mapped type applied to a self-referencing interface — `PathValue`, `DeepReadonly` (from other topic pages), and similar recursive utilities all share this exact structural vulnerability.',
    },
  ];
}
