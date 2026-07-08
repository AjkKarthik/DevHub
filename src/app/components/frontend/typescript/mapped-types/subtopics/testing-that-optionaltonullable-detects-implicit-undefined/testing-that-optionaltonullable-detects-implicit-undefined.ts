import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-optionaltonullable-detects-implicit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-optionaltonullable-detects-implicit-undefined.html',
  styleUrl: './testing-that-optionaltonullable-detects-implicit-undefined.scss',
})
export class TestingThatOptionaltonullableDetectsImplicitUndefinedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Third Mapped Type, a Different Outcome',
      points: [
        'The Mapped + Conditional Combined tab defines <code>type OptionalToNullable&lt;T&gt; = { [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K] }</code>, described only in a one-line comment as "map only optional keys to nullable." No example interface accompanies it on the main page.',
        'The previous two subtopics found that <code>EventHandlers</code> and <code>StringKeys</code> both have real gaps around optional properties. This subtopic tests whether <code>OptionalToNullable</code> — which is SPECIFICALLY about optional properties — correctly detects an optional property that has NO explicit <code>| undefined</code> written anywhere in its declaration.',
      ],
    },
    {
      heading: 'Why This One Works Without Needing NonNullable',
      points: [
        'The condition is <code>undefined extends T[K]</code> — checking whether <code>undefined</code> is ONE OF the members of <code>T[K]</code>, using <code>extends</code> in the OPPOSITE direction from <code>StringKeys</code>\'s check. This is exactly the right check for detecting optionality, because — as established in the previous subtopic — an optional property\'s indexed-access type <code>T[K]</code> ALWAYS includes <code>undefined</code>, even when the declared type has no explicit <code>| undefined</code>.',
        'For a plain optional property like <code>bio?: string</code>, <code>T[\'bio\']</code> is <code>string | undefined</code>. Checking <code>undefined extends string | undefined</code> is <code>true</code> (undefined IS one of the union members), so the type correctly resolves to <code>T[K] | null</code> — <code>string | undefined | null</code> for that key.',
        'This is the mirror image of the <code>StringKeys</code> problem: <code>StringKeys</code> checked <code>T[K] extends string</code> (does the WHOLE type match?), which optional properties fail. <code>OptionalToNullable</code> checks <code>undefined extends T[K]</code> (is undefined a MEMBER of the type?), which optional properties always pass. The direction of the extends check is what makes the difference.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>OptionalToNullable and implicit undefined</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own OptionalToNullable utility, unchanged
type OptionalToNullable<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
};

// An interface with a PLAIN optional property -- no explicit
// "| undefined" written anywhere, just the ? modifier
interface UserProfile {
  id: string;        // required
  bio?: string;       // optional -- NO explicit | undefined in the source
}

type NullableProfile = OptionalToNullable<UserProfile>;

// A helper that only compiles if null is assignable to the given field's type
function assertAcceptsNull<T, K extends keyof T>(
  obj: T, key: K, check: (val: T[K]) => T[K]
): void {}

const sample: NullableProfile = { id: '1', bio: 'hello' };
sample.bio = null; // does this compile?
console.log('assigned null to bio:', sample.bio);

// sample.id = null;
// Uncomment above -- id was REQUIRED (no ?), so it should NOT
// have been converted to nullable. Does this compile?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `sample.id = null;`. Confirm it fails to compile, proving OptionalToNullable correctly left the required `id` field untouched while making the optional `bio` field nullable.',
    hint: 'undefined extends T[K] is only true when T[K] itself includes undefined -- a required property\'s indexed-access type never does, regardless of how the property is written.',
    solution: `sample.id = null fails to compile: "Type 'null' is not assignable
to type 'string'." -- confirming id, a required property, was
correctly left as plain string by OptionalToNullable, not converted
to string | null.

This confirms OptionalToNullable works correctly precisely BECAUSE
it checks in the right direction: "is undefined a member of T[K]?"
is true for ANY optional property regardless of how it's declared,
while the previous subtopic's StringKeys check ("does T[K] entirely
match string?") is false for optional properties for the exact same
underlying reason -- the direction of the extends check determines
whether optionality helps or hurts the filter.

Practical takeaway: when writing a mapped type that needs to KEEP
or SPECIAL-CASE optional properties, check "undefined extends T[K]"
(or use the ? modifier directly via a modifier check). When you need
to filter members BY THEIR NON-undefined type (like StringKeys),
strip undefined first with NonNullable<T[K]>.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'since the previous two subtopics found that EventHandlers and StringKeys both mishandle optional properties, every conditional-type-based mapped type on this page probably has the same kind of gap.',
      reality: '`OptionalToNullable` correctly handles optional properties, because it checks `undefined extends T[K]` (is undefined a member of the type?) rather than `T[K] extends SomeType` (does the whole type match a target?) — the direction of the extends check determines whether optionality helps or breaks the filter.',
    },
    {
      thought: '`OptionalToNullable` needs to check for the literal `?` modifier on each property to know which ones are optional.',
      reality: 'it never inspects the modifier directly — it relies entirely on the fact that TypeScript already bakes `| undefined` into an optional property\'s indexed-access type, and simply tests for that fact structurally.',
    },
    {
      thought: 'a required property with no `?` modifier could still accidentally get converted to nullable by `OptionalToNullable` if its declared type happens to be broad.',
      reality: '`undefined extends T[K]` is only true when `undefined` is genuinely one of `T[K]`\'s members — a required property\'s indexed-access type never includes `undefined` unless the property was explicitly typed with `| undefined`, regardless of how broad the rest of its type is.',
    },
  ];
}
