import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-private-json-stringify-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-typescript-private-is-still-included-in-json-stringify.html',
  styleUrl: './testing-that-typescript-private-is-still-included-in-json-stringify.scss',
})
export class TestingThatTypescriptPrivateIsStillIncludedInJsonStringifySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s One Documented Bypass',
      points: [
        'Common Mistake #1 demonstrates that TypeScript <code>private</code> is bypassed via <code>(u as any).password</code>. That is the ONLY bypass the page shows — a deliberate cast written by the developer themselves.',
        'This subtopic tests a bypass that requires NO cast at all, and that many developers reach for automatically, without thinking of it as "bypassing privacy": <code>JSON.stringify()</code>. If a <code>private</code>-declared field is serialized into an API response or logged object, does it leak?',
      ],
    },
    {
      heading: 'Why JSON.stringify Doesn\'t Care About TypeScript\'s private',
      points: [
        '<code>JSON.stringify</code> operates on the actual JavaScript object at runtime, iterating its OWN ENUMERABLE properties — exactly the same mechanism as <code>Object.keys()</code> or a <code>for...in</code> loop. TypeScript\'s <code>private</code> modifier produces a perfectly ordinary, fully enumerable JavaScript property; there is nothing in the compiled output that distinguishes it from a public one.',
        'This means <code>JSON.stringify(new User(...))</code> serializes the <code>private password</code> field exactly as if it were public — a genuine, common way sensitive TypeScript-<code>private</code> data ends up in an HTTP response body or a log line, with no cast, no <code>any</code>, and no obviously "unsafe" code anywhere in sight.',
        'A genuine JavaScript <code>#privateField</code>, by contrast, is NOT an enumerable own property in the way <code>JSON.stringify</code>/<code>Object.keys</code>/spread can see — it lives in a special internal slot the ECMAScript spec deliberately makes invisible to all of these reflection mechanisms. <code>#password</code> is correctly excluded from <code>JSON.stringify</code> output.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>private vs # and JSON.stringify</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own User pattern, using TypeScript's private keyword
class TsPrivateUser {
  constructor(public name: string, private password: string) {}
}

const tsUser = new TsPrivateUser('Alice', 'super-secret-123');

// No cast, no "as any" -- just ordinary JSON.stringify
console.log('JSON.stringify with TS private:', JSON.stringify(tsUser));
// Does the output contain "super-secret-123"?

console.log('Object.keys with TS private:', Object.keys(tsUser));
// Does "password" appear in the key list?

// Compare: the same shape, using JavaScript's # runtime-private field instead
class HashPrivateUser {
  #password: string;
  constructor(public name: string, password: string) {
    this.#password = password;
  }
}

const hashUser = new HashPrivateUser('Alice', 'super-secret-123');

console.log('JSON.stringify with # private:', JSON.stringify(hashUser));
// Does THIS output contain the password?

console.log('Object.keys with # private:', Object.keys(hashUser));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third line, `console.log({ ...tsUser });` (spreading tsUser into a plain object). Does the spread also leak the password? Compare against `{ ...hashUser }`.',
    hint: 'Spread syntax, like JSON.stringify and Object.keys, only sees enumerable own properties -- the exact same mechanism, so it behaves identically for both cases.',
    solution: `console.log({ ...tsUser }) logs { name: 'Alice', password:
'super-secret-123' } -- the spread leaks the password exactly like
JSON.stringify and Object.keys did, for the identical reason: TS
private compiles to an ordinary enumerable property.

console.log({ ...hashUser }) logs only { name: 'Alice' } -- the #
private field is correctly excluded, because spread syntax (like
JSON.stringify and Object.keys) only ever sees enumerable OWN
properties, and # fields are specified to be invisible to all of
these reflection mechanisms, not merely "hard to access."

The practical rule: TypeScript's private is a code-review and
IDE-autocomplete tool for YOUR OWN codebase's call sites -- it is
not a serialization or security boundary. Any field that must never
leave the class (passwords, tokens, internal Symbols) needs #, not
private.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a `private`-declared class field is automatically excluded from `JSON.stringify()`, `Object.keys()`, and object spread, the same way a genuinely private implementation detail should be.',
      reality: 'TypeScript `private` compiles to an ordinary, fully enumerable JavaScript property — `JSON.stringify`, `Object.keys`, and spread all see it exactly as they would see a `public` field, with zero exclusion.',
    },
    {
      thought: 'the main page\'s Common Mistake #1 ("private is bypassed via `as any`") covers the full extent of TypeScript private\'s runtime weakness — avoiding explicit casts is enough to stay safe.',
      reality: 'no cast is needed at all for the leak this subtopic demonstrates — ordinary, everyday code like `JSON.stringify(user)` in an API response handler leaks a "private" field with no `any`, no cast, and nothing that looks unsafe at the call site.',
    },
    {
      thought: 'JavaScript\'s `#privateField` is just a stricter version of the same mechanism as TypeScript\'s `private` — harder to access, but conceptually similar.',
      reality: '`#` fields are specified at the ECMAScript language level to be genuinely invisible to reflection mechanisms like `Object.keys`, `JSON.stringify`, and spread — this is a fundamentally different runtime mechanism, not merely a stricter compile-time check.',
    },
  ];
}
