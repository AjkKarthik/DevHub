import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-functionkeys-drops-optional-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-functionkeys-drops-optional-methods-from-the-result.html',
  styleUrl: './testing-that-functionkeys-drops-optional-methods-from-the-result.scss',
})
export class TestingThatFunctionkeysDropsOptionalMethodsFromTheResultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s FunctionKeys Example',
      points: [
        'The Flatten & Conditional Generics tab defines <code>type FunctionKeys&lt;T&gt; = { [K in keyof T]: T[K] extends (...args: unknown[]) =&gt; unknown ? K : never }[keyof T]</code>, and demonstrates it on a <code>Service</code> interface where every method (<code>fetch</code>, <code>save</code>) is REQUIRED, correctly yielding <code>\'fetch\' | \'save\'</code>.',
        'This subtopic tests the one case the example never includes: what happens when a method on the interface is OPTIONAL — declared with a <code>?</code>, like <code>onOptional?(): void</code>. Does <code>FunctionKeys</code> still pick it up?',
      ],
    },
    {
      heading: 'Why Optional Properties Break the Conditional Check',
      points: [
        'For a required property, <code>T[K]</code> is exactly the function type — e.g. <code>() =&gt; Promise&lt;void&gt;</code> — which does extend <code>(...args: unknown[]) =&gt; unknown</code>, so <code>K</code> is kept. For an OPTIONAL property declared with <code>?</code>, TypeScript\'s indexed access type <code>T[K]</code> is not just the function type — it is <code>(() =&gt; void) | undefined</code>, because the property might genuinely be absent.',
        'A union type only extends another type if EVERY member of the union does. <code>undefined</code> does not extend <code>(...args: unknown[]) =&gt; unknown</code> — functions cannot be undefined. So the whole union <code>(() =&gt; void) | undefined</code> fails the <code>extends</code> check, the conditional resolves to the <code>never</code> branch, and that key is silently excluded from <code>FunctionKeys&lt;T&gt;</code>.',
        'This is a well-known, general pitfall for any conditional-type-based key filter (not specific to this exact utility) — optional properties need to be checked with the <code>undefined</code> stripped out first, e.g. <code>NonNullable&lt;T[K]&gt; extends (...args: unknown[]) =&gt; unknown</code>, to correctly include them.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>FunctionKeys and optional methods</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own FunctionKeys utility, unchanged
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

// The main page's Service interface, PLUS one optional method added for this test
interface Service {
  id: string;
  name: string;
  fetch(): Promise<void>;
  save(data: unknown): boolean;
  onOptional?(): void; // optional -- not on the original main-page example
}

type ServiceMethods = FunctionKeys<Service>;
// The main page's original result (without onOptional) was 'fetch' | 'save'.
// With onOptional added, is it now 'fetch' | 'save' | 'onOptional'?

// A helper that only compiles if its argument is assignable to ServiceMethods
function assertIsFunctionKey<K extends ServiceMethods>(key: K): K { return key; }

assertIsFunctionKey('fetch'); // compiles -- required method
assertIsFunctionKey('save');  // compiles -- required method

// assertIsFunctionKey('onOptional');
// Uncomment the line above -- does it compile?

console.log('If no build error appeared above, onOptional WAS included in FunctionKeys<Service>.');
console.log('If you see a build error when you uncomment the assertIsFunctionKey(\\'onOptional\\') line,');
console.log('that confirms the optional method was silently dropped from ServiceMethods.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `assertIsFunctionKey(\'onOptional\')` line. Read the exact compiler error. Then write a corrected `FunctionKeysIncludingOptional<T>` that uses `NonNullable<T[K]>` to include optional methods too.',
    hint: 'The fix only needs to strip `| undefined` from T[K] before the extends check -- NonNullable<T[K]> does exactly that.',
    solution: `Uncommenting the line gives: "Argument of type 'onOptional' is not
assignable to parameter of type 'fetch' | 'save'." -- confirming
onOptional was silently excluded from FunctionKeys<Service>.

A corrected version:

type FunctionKeysIncludingOptional<T> = {
  [K in keyof T]: NonNullable<T[K]> extends (...args: unknown[]) => unknown
    ? K
    : never;
}[keyof T];

NonNullable<T[K]> strips the | undefined from an optional property's
indexed-access type before the extends check runs, so
(() => void) | undefined becomes just () => void, which correctly
extends the function constraint. Applying this fixed version to the
same Service interface (with onOptional included) now correctly
yields 'fetch' | 'save' | 'onOptional'.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a conditional type like `T[K] extends (...args: unknown[]) => unknown ? K : never` correctly identifies every method key on an interface, whether the method is required or optional.',
      reality: 'for an optional property, `T[K]` includes `| undefined` (since the property might be absent) — and a union only extends a type if every member does, so the whole check fails and the key is silently dropped, unless `NonNullable<T[K]>` is used first.',
    },
    {
      thought: 'the main page\'s FunctionKeys example, tested only against a Service interface with all-required methods, generalizes safely to any interface, including ones with optional methods.',
      reality: 'the example never included an optional property, so it never exercised this exact failure mode — a utility type validated only against required properties can hide a real gap for optional ones.',
    },
    {
      thought: 'if `FunctionKeys<Service>` silently omits an expected key, that is a bug in the `keyof` operator or in how TypeScript handles interfaces.',
      reality: 'the root cause is specifically the interaction between the OPTIONAL modifier (`?`) and the `extends` check inside the conditional — `keyof` itself correctly includes `onOptional` in `keyof Service`; it is only the function-type conditional that then filters it back out.',
    },
  ];
}
