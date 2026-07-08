import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-direction-42-returns-undefined-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-direction-42-returns-undefined-not-a-name.html',
  styleUrl: './testing-that-direction-42-returns-undefined-not-a-name.scss',
})
export class TestingThatDirection42ReturnsUndefinedNotANameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Two Separate Claims',
      points: [
        'The theory section says numeric enums generate "a bidirectional mapping object" and that <code>Direction[0]</code> returns <code>"Up"</code>. Separately, the first Common Mistake says numeric enums are "open" — <code>let s: Status = 999;</code> compiles with no error, because TypeScript allows any number to be assigned to a numeric enum variable.',
        'Read together, these two claims invite an assumption: since the enum has a reverse mapping AND accepts any number, surely <code>Direction[anyNumber]</code> always gives you SOME name back. This subtopic tests that assumption directly.',
      ],
    },
    {
      heading: 'Why the Reverse Mapping Is Incomplete',
      points: [
        'The reverse mapping object TypeScript generates only contains entries for the numbers actually assigned to enum members at declaration time — for <code>enum Direction { Up, Down, Left, Right }</code>, that is exactly <code>{ 0: "Up", 1: "Down", 2: "Left", 3: "Right" }</code> merged into the forward mapping object. There is no entry for 42, because no member was ever assigned 42.',
        'The "open" type-safety hole (accepting any number) and the reverse mapping (a lookup table built only from declared members) are two independent mechanisms. TypeScript\'s type checker allows the out-of-range assignment at compile time; the JavaScript object at runtime simply has no key for that number. Indexing it with a key that isn\'t there returns <code>undefined</code>, exactly like indexing any plain object with a missing key.',
        'This means the reverse mapping is only reliable for values that actually came from the enum itself (e.g. iterating <code>Object.values(Direction)</code> or using a value already known to be a declared member) — not for arbitrary numbers that merely satisfy the (too-permissive) numeric enum type.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Numeric enum reverse mapping</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

// A declared value -- reverse mapping works as documented
console.log('Direction[0] =', Direction[0]); // "Up"

// The "open" type-safety hole -- TypeScript allows this assignment
let n: Direction = 42;
console.log('assigned 42 to a Direction variable -- did TypeScript error?', 'no');

// Does the reverse mapping cover it?
console.log('Direction[42] =', Direction[n]); // undefined -- no member was ever assigned 42

// Compare: the forward + reverse mapping object only has keys for
// declared members, in both directions
console.log('Object.keys(Direction) =', Object.keys(Direction));
// ["0", "1", "2", "3", "Up", "Down", "Left", "Right"] -- 42 is nowhere in there

// A bitwise-flag numeric enum makes this even more visible: combined
// flag values are never assigned to a single member, so they have no
// reverse-mapping entry either, even though they're perfectly valid
// numbers to store in a variable of that enum's type.
enum Permission {
  None  = 0,
  Read  = 1 << 0, // 1
  Write = 1 << 1, // 2
  Admin = 1 << 2, // 4
}
const combined: Permission = Permission.Read | Permission.Write; // 3 -- a legal Permission value
console.log('Permission[3] =', Permission[combined]); // undefined -- 3 was never assigned to a single member
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a line that reverse-maps `Permission.Admin` on its own (not combined with anything). Does that one resolve to a name? Then compare it against the combined `Read | Write` lookup that already prints `undefined`.',
    hint: 'The reverse mapping only has entries for the exact numbers assigned to individual declared members — Admin (4) was declared on its own, but 3 (Read | Write combined) never was.',
    solution: `console.log(Permission[Permission.Admin]); // "Admin" -- 4 was
declared directly on a member, so the reverse mapping has that entry.

console.log(Permission[3]); // undefined -- no member was ever
assigned exactly 3, even though Read | Write legally produces 3 and
TypeScript's numeric-enum type happily accepts it as a Permission value.

The pattern: the reverse mapping is a lookup table built ONLY from
the numbers written at declaration time. Any other number that the
(open) numeric enum type permits -- whether from an out-of-range
assignment or a bitwise combination -- has no name to return.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because numeric enums generate a reverse mapping, `EnumName[anyNumber]` will always give back some member name, since the type system already accepts any number for that variable.',
      reality: 'the reverse mapping only contains entries for the exact numbers assigned to declared members at compile time — indexing it with any other number (whether out-of-range or a bitwise combination) returns `undefined`, the same as indexing a plain object with a missing key.',
    },
    {
      thought: 'the numeric enum "open type" hole and the reverse mapping are the same mechanism, so a value that passes the type check must also be reverse-mappable.',
      reality: 'they are two independent things — one is a compile-time type-checking rule (which numbers TypeScript allows you to assign), the other is a runtime lookup object (which numbers were actually declared) — and the first is deliberately more permissive than the second.',
    },
    {
      thought: 'bitwise-flag enums like `Permission` can always be reverse-mapped to show a readable combined name, similar to how `Direction[0]` gives `"Up"`.',
      reality: 'combined flag values (like `Read | Write` = 3) are never individually assigned to a member, so they have no reverse-mapping entry at all — only flags used on their own, like `Admin` = 4, resolve to a name.',
    },
  ];
}
