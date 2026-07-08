import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-isuser-fix-as-any-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-safe-isuser-fix-still-uses-as-any-twice.html',
  styleUrl: './testing-that-the-safe-isuser-fix-still-uses-as-any-twice.scss',
})
export class TestingThatTheSafeIsuserFixStillUsesAsAnyTwiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the "Wrong" Example Actually Does at Runtime',
      points: [
        'The "Unsafe type predicates that return the wrong boolean" mistake block\'s "wrong" example is <code>function isUser(val: unknown): val is User { return true; }</code> — the comment claims <code>isUser(42)</code> causes a "runtime crash," but never shows what that crash looks like or where it happens. This subtopic completes that missing piece with an actual reproduction.',
        'The "right" fix reads: <code>typeof val === \'object\' && val !== null && \'id\' in val && typeof (val as any).id === \'number\' && ...</code> — note the <code>(val as any)</code> casts used to read <code>.id</code> and <code>.name</code> off a value already narrowed by <code>\'id\' in val</code>. This is the SAME theme the section\'s own theory warns about: "TypeScript trusts you — returning true on the wrong branch is an unsafe bug that compiles." An <code>as any</code> cast is a similarly unconditional trust statement to the compiler.',
      ],
    },
    {
      heading: 'Why the as any Casts Aren\'t Strictly Necessary Here',
      points: [
        'After <code>typeof val === \'object\' && val !== null && \'id\' in val</code>, TypeScript already narrows <code>val</code> to <code>object & Record<"id", unknown></code> — meaning <code>val.id</code> is directly accessible with type <code>unknown</code>, with NO cast required. <code>typeof val.id === \'number\'</code> works exactly the same as <code>typeof (val as any).id === \'number\'</code>, but without opting out of type checking on that expression.',
        'The practical difference matters if the predicate is ever edited carelessly: with <code>as any</code>, a typo like <code>(val as any).idd</code> compiles silently (checked, correctly, in the earlier "excess property" subtopic on this hub) — with the property accessed directly off the narrowed <code>val</code> instead, the SAME typo is caught immediately as "Property \'idd\' does not exist," which is precisely the kind of protection a type predicate\'s own correctness benefits most from, given the theory section\'s own warning that a broken predicate "silently corrupts types."',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>isUser predicate — wrong vs. as any vs. fully checked</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `interface User { id: number; name: string }

// ── Reproducing the "wrong" example's actual crash ──────────────────────────
function isUserWrong(val: unknown): val is User {
  return true;   // the main page's exact "wrong" example
}

function greet(val: unknown) {
  if (isUserWrong(val)) {
    console.log(\`Hello, \${val.name.toUpperCase()}!\`);   // val is (incorrectly) typed as User
  }
}
try {
  greet(42);   // isUserWrong(42) returns true -- TypeScript trusts it completely
} catch (e) {
  if (e instanceof TypeError) {
    console.log('Crash:', e.message);
    // "Crash: Cannot read properties of undefined (reading 'toUpperCase')"
    // -- (42).name is undefined, and undefined.toUpperCase() throws.
    // THIS is the "runtime crash" the main page's comment only describes
    // in the abstract, never actually shows.
  }
}

// ── The main page's "right" fix -- still uses 'as any' twice ────────────────
function isUserWithAsAny(val: unknown): val is User {
  return (
    typeof val === 'object' && val !== null &&
    'id'   in val && typeof (val as any).id   === 'number' &&
    'name' in val && typeof (val as any).name === 'string'
  );
}

// ── Equivalent fix with NO 'any' anywhere ────────────────────────────────────
function isUserFullyChecked(val: unknown): val is User {
  return (
    typeof val === 'object' && val !== null &&
    'id'   in val && typeof val.id   === 'number' &&
    'name' in val && typeof val.name === 'string'
  );
  // val.id / val.name work directly here -- no cast needed, because
  // 'id' in val / 'name' in val already narrow val to
  // object & Record<'id', unknown> & Record<'name', unknown>
}

console.log(isUserWithAsAny({ id: 1, name: 'Alice' }));      // true
console.log(isUserFullyChecked({ id: 1, name: 'Alice' }));   // true
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In isUserWithAsAny, change `(val as any).id` to `(val as any).idd` (a typo). Does it still compile? Now make the same typo in isUserFullyChecked (change `val.id` to `val.idd`). Does that version still compile?',
    hint: 'Compare what type checking applies to a property access through `as any` versus a property access on a value TypeScript has already narrowed through an `in` check.',
    solution: `isUserWithAsAny still compiles cleanly with the "idd" typo -- "as
any" disables type checking on that entire expression, so
TypeScript has no way to know "idd" isn't a real property. The
predicate would now silently always treat the id check as
satisfied by an unrelated (and likely undefined) property, exactly
the kind of "wrong implementation silently corrupts types" problem
the section's own theory warns about, just introduced through a
typo instead of a deliberately wrong return value.

isUserFullyChecked, by contrast, fails to compile with the same
typo: "Property 'idd' does not exist on type...". Because val.id is
accessed directly on the narrowed type (no "as any" involved),
TypeScript catches the typo immediately -- exactly the protection a
type predicate's own correctness benefits from most, since a broken
predicate is trusted unconditionally by every caller.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code example presented as the "right" fix for an unsafe type predicate must itself be free of any type-safety compromises.',
      reality: 'here the "right" fix still uses `as any` twice — it correctly fixes the SPECIFIC mistake being illustrated (always returning true) while leaving a different, smaller type-safety gap (typo-prone property access) unaddressed.',
    },
    {
      thought: 'after narrowing `unknown` with `\'property\' in val`, you still need a cast to actually read that property.',
      reality: 'the `in` operator narrows `val` to include that property (typed as `unknown`) — the property is directly accessible with no cast at all; `as any` at that point is unnecessary and reintroduces the exact "compiler stops checking" risk the surrounding code is trying to avoid.',
    },
    {
      thought: 'the practical risk of `as any` inside a validation function is purely theoretical, since the validation logic is presumably reviewed carefully.',
      reality: 'the concrete, demonstrated risk is a typo in a property name going completely uncaught by the compiler — exactly the kind of silent mistake careful review is meant to catch, but which `as any` specifically defeats the compiler\'s ability to flag automatically.',
    },
  ];
}
