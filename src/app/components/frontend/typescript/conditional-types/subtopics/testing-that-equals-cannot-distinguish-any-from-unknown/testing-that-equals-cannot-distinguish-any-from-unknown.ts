import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-equals-cannot-distinguish-any-unknown-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-equals-cannot-distinguish-any-from-unknown.html',
  styleUrl: './testing-that-equals-cannot-distinguish-any-from-unknown.scss',
})
export class TestingThatEqualsCannotDistinguishAnyFromUnknownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Warning, Extended',
      points: [
        'The Disabling Distribution tab defines <code>type Equals&lt;A, B&gt; = [A] extends [B] ? [B] extends [A] ? true : false : false</code> and its own comment already flags one surprise: <code>Equals&lt;string, any&gt; // true (any is special)</code>.',
        'That comment stops at one example. This subtopic tests a related, arguably MORE surprising case the page never shows: <code>Equals&lt;any, unknown&gt;</code>. Two types with completely different semantics — <code>any</code> disables checking entirely, <code>unknown</code> demands narrowing before use — checked against each other with the page\'s own utility.',
      ],
    },
    {
      heading: 'Why any Breaks Assignability-Based Equality in Both Directions',
      points: [
        '<code>any</code> is bidirectionally assignable with virtually everything: any value is assignable TO a variable of type <code>any</code>, AND a value typed <code>any</code> is assignable to almost any other type without a cast. This is precisely why the page\'s own <code>Equals&lt;string, any&gt;</code> returns <code>true</code> — <code>[string] extends [any]</code> and <code>[any] extends [string]</code> are both true.',
        'The same absorbing behavior applies to <code>unknown</code>: <code>[any] extends [unknown]</code> is true (everything is assignable to unknown), and <code>[unknown] extends [any]</code> is ALSO true (any absorbs unknown too, same as it absorbs string). So <code>Equals&lt;any, unknown&gt;</code> resolves to <code>true</code>, even though these are among the most semantically different types in the entire type system.',
        'The page already defines a separate, unrelated utility right next to Equals — <code>type IsAny&lt;T&gt; = 0 extends (1 & T) ? true : false</code> — that specifically detects <code>any</code> (using the fact that <code>1 & any</code> is <code>any</code>, so <code>0 extends any</code> is true, uniquely true only for any). Combining IsAny with Equals is the standard fix for a genuinely accurate type-equality check.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Equals and any vs unknown</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own Equals and IsAny utilities, unchanged
type Equals<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;

// The page's own documented case
type SameAsStringAny = Equals<string, any>; // true, per the page's own comment

// This subtopic's test: two VERY different types
type SameAsAnyUnknown = Equals<any, unknown>;
// Does Equals correctly report these as DIFFERENT (false),
// or does it also collapse them to true, like the string/any case?

function assertTrue<T extends true>(): void {}
function assertFalse<T extends false>(): void {}

// assertTrue<SameAsAnyUnknown>();
// Uncomment above -- does this compile? If it does, Equals<any, unknown> is true.

// A fixed version that excludes any first, using the page's own IsAny
type StrictEquals<A, B> =
  IsAny<A> extends true
    ? IsAny<B> extends true ? true : false
    : IsAny<B> extends true
      ? false
      : Equals<A, B>;

type StrictAnyUnknown = StrictEquals<any, unknown>;
// assertFalse<StrictAnyUnknown>();
// Uncomment above -- does the FIXED version correctly say false?

console.log('Compile-time only findings -- see the Try It exercise for the exact errors.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `assertTrue<SameAsAnyUnknown>();`. Confirm it compiles (proving Equals<any, unknown> is true). Then uncomment `assertFalse<StrictAnyUnknown>();` and confirm the fixed StrictEquals correctly distinguishes them.',
    hint: 'IsAny<T> uses the fact that `1 & any` collapses to `any` itself (a property unique to any among all types) — checking IsAny on both sides before falling back to Equals is what fixes the confusion.',
    solution: `assertTrue<SameAsAnyUnknown>() compiles with no error, confirming
Equals<any, unknown> genuinely evaluates to true using the page's
own utility -- the same "any is special" quirk the page's comment
already flags for Equals<string, any>, just with a more surprising
second type.

assertFalse<StrictAnyUnknown>() ALSO compiles, confirming the fixed
StrictEquals correctly reports any and unknown as different, by
first checking IsAny<A> and IsAny<B> independently before falling
back to the ordinary bidirectional-assignability check.

The broader lesson: any TYPE-LEVEL "are these equal?" utility built
purely from bidirectional extends checks (the Equals pattern) will
misreport any as equal to whatever it's compared against, because
any is deliberately special-cased throughout TypeScript's
assignability rules to disable checking rather than participate in
it normally.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own warning — "Equals<string, any> // true (any is special)" — covers the full extent of the any-related quirk in this utility.',
      reality: '`any` breaks the Equals check against EVERY other type it is compared with, not just `string` — including `unknown`, which is otherwise one of the most carefully distinguished types in TypeScript\'s hierarchy.',
    },
    {
      thought: 'since `any` and `unknown` behave very differently in ordinary code (any disables checks, unknown demands narrowing), a type-level equality utility would naturally tell them apart.',
      reality: '`Equals<A, B>` only checks bidirectional assignability — it has no way to distinguish "assignable because any bypasses checking" from "assignable because the types are genuinely identical," so any collapses every comparison it participates in to true.',
    },
    {
      thought: 'the page\'s separate `IsAny<T>` utility is unrelated to the Equals utility — they solve different problems on different parts of the page.',
      reality: 'combining them is the standard, documented fix for exactly this gap — `IsAny` exists specifically to detect the one case (`any`) that breaks ordinary assignability-based equality checks like `Equals`.',
    },
  ];
}
