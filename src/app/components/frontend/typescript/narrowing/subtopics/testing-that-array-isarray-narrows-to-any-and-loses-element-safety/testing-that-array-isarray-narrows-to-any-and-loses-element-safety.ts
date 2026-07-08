import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-array-isarray-any-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-array-isarray-narrows-to-any-and-loses-element-safety.html',
  styleUrl: './testing-that-array-isarray-narrows-to-any-and-loses-element-safety.scss',
})
export class TestingThatArrayIsarrayNarrowsToAnyAndLosesElementSafetySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the Main Page States, in Passing',
      points: [
        'The "Narrowing with Array.isArray and discriminant fields" theory section mentions, briefly: "<code>Array.isArray(x)</code> is a built-in type predicate that narrows to <code>any[]</code>." It states this as a simple fact and moves on to discuss discriminated unions — it never demonstrates what narrowing to <code>any[]</code> specifically means for what you can safely do with the array\'s elements afterward.',
        'This is TypeScript\'s own actual library definition — <code>Array.isArray(arg: any): arg is any[]</code> — not an error on the main page\'s part. But the CONSEQUENCE is worth testing directly: narrowing an <code>unknown</code> value to <code>any[]</code> means every ELEMENT of that array is now typed <code>any</code>, silently reintroducing the exact unchecked-access behavior <code>unknown</code> was protecting against in the first place.',
      ],
    },
    {
      heading: 'Why This Is an Easy Trap',
      points: [
        'It feels like progress: you started with <code>unknown</code> (nothing accessible without narrowing), confirmed it\'s an array with <code>Array.isArray()</code>, and now TypeScript lets you index into it and call methods on the elements with zero further complaints — which reads as "safely narrowed." In reality, every element access compiles WITHOUT checking, because <code>any[]</code> elements are <code>any</code>, not <code>unknown</code>.',
        'The main page\'s own "Narrowing with Array.isArray" code tab actually does this correctly — <code>data.filter((x): x is string => typeof x === \'string\')</code> adds a SECOND narrowing step for the elements. But that extra step is easy to skip if you only remember "<code>Array.isArray</code> narrows the value," without also remembering that it does nothing to constrain each individual element.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Array.isArray narrows to any[]</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function processUnsafe(data: unknown) {
  if (!Array.isArray(data)) return;
  // data: any[] here -- confirmed by the main page's own claim

  console.log(data[0].toUpperCase());
  // ✅ COMPILES with zero errors -- even though data[0] could be a
  // number, an object, or anything else at runtime. 'any[]' elements
  // are 'any', which disables checking exactly like the original
  // 'unknown' parameter was supposed to prevent.
}

try {
  processUnsafe([42, 'not actually a string first']);
  // Runtime crash: (42).toUpperCase is not a function --
  // TypeScript never warned about this at compile time.
} catch (e) {
  if (e instanceof TypeError) console.log('Crash:', e.message);
}

// ── The main page's OWN full example adds the missing second step ───────────
function processSafe(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((x): x is string => typeof x === 'string');
  // The extra type-predicate filter narrows EACH ELEMENT, not just
  // confirming the value is an array.
}

console.log(processSafe([42, 'real string', 'another string']));
// ["real string", "another string"] -- the non-string element was
// safely excluded, not blindly trusted.
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In processUnsafe, hover over (or check the inferred type of) `data` right after the `Array.isArray(data)` check, and separately check the type of `data[0]`. Are they the same "level of safety" as the original unknown parameter, or different?',
    hint: 'Compare what operations are allowed directly on `data` as a whole (the array) versus on `data[0]` (an individual element) — does TypeScript still require narrowing for one of them but not the other?',
    solution: `data itself is any[] — you can safely confirm it's an array and use
array-level operations. But data[0] (or any individual element) is
any, not unknown — TypeScript places NO restrictions on what you do
with it, exactly as if the element had never been unknown at all.
This is a meaningfully different, WEAKER level of safety than the
original unknown parameter provided.

This is precisely why the main page's own working example goes one
step further with data.filter((x): x is string => typeof x ===
'string') — that filter call narrows each ELEMENT individually,
restoring the safety that Array.isArray's any[] result alone does
not provide. Skipping that second step (as processUnsafe does)
compiles cleanly but reintroduces exactly the kind of unchecked
access unknown was meant to prevent in the first place.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once Array.isArray(x) confirms a value is an array, the elements of that array are just as safely typed as the array itself was after narrowing.',
      reality: 'Array.isArray narrows the VALUE to any[] — but any[] elements are individually typed any, meaning each element access is completely unchecked, unlike the array reference itself which is confirmed to be an array.',
    },
    {
      thought: 'a value narrowed away from `unknown` by any built-in type guard is now generally "safe" to use without further checks.',
      reality: 'safety depends on exactly WHAT the guard narrows to — Array.isArray narrows to any[], which is only safe for array-level operations (length, iteration); element-level safety requires an additional, separate narrowing step.',
    },
    {
      thought: 'if code compiles without any TypeScript errors after a narrowing check, the underlying data has actually been validated at that point.',
      reality: 'compiling cleanly only means the TYPE SYSTEM has no complaints — as demonstrated here, any[] elements accept any operation without complaint precisely because they carry no type information to check against at all.',
    },
  ];
}
