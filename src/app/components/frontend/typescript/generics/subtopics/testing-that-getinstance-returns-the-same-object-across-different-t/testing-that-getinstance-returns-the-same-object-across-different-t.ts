import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-getinstance-same-object-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-getinstance-returns-the-same-object-across-different-t.html',
  styleUrl: './testing-that-getinstance-returns-the-same-object-across-different-t.scss',
})
export class TestingThatGetinstanceReturnsTheSameObjectAcrossDifferentTSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Fixed Registry Pattern',
      points: [
        'Common Mistake #5 shows the fix for "static members cannot reference the class type parameter": <code>static getInstance&lt;T&gt;(): Registry&lt;T&gt; { return (Registry._instance ??= new Registry()) as Registry&lt;T&gt;; }</code>, with <code>_instance</code> typed as <code>Registry&lt;unknown&gt;</code>.',
        'The explanation says this is correct because "static methods that need a type parameter must declare their own." True — it compiles and is exactly the right fix for the compile error being demonstrated. This subtopic asks a different question: what object does <code>Registry.getInstance&lt;string&gt;()</code> versus <code>Registry.getInstance&lt;number&gt;()</code> actually return at runtime?',
      ],
    },
    {
      heading: 'The Cast Relabels, It Does Not Isolate',
      points: [
        'The QnA section states generics "are completely erased in the JavaScript output" and "there is no T" at runtime. Applied to this exact pattern: <code>Registry._instance ??= new Registry()</code> creates the object AT MOST ONCE, the first time <code>getInstance</code> is ever called with any type argument — every later call, regardless of what <code>&lt;T&gt;</code> is written at the call site, returns that SAME cached object.',
        '<code>as Registry&lt;T&gt;</code> is a type assertion, not a conversion or a check — it tells the compiler "trust me, treat this value as this type," without generating any runtime code to enforce or verify it. So <code>Registry.getInstance&lt;string&gt;()</code> and <code>Registry.getInstance&lt;number&gt;()</code> are, at runtime, <code>===</code> the identical reference — the "different types" exist only in each call site\'s local type-checking view, not as any actual separation of data.',
        'This is not a flaw specific to this code — it is exactly what a true singleton is SUPPOSED to do (one shared instance). The point worth internalizing is narrower: the generic type parameter on <code>getInstance&lt;T&gt;</code> provides zero runtime partitioning between different "typed" call sites; anything one caller stores through the instance is visible, untyped-safely, to every other caller regardless of which <code>T</code> they wrote.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Generic singleton reference equality</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own fixed Registry pattern, unchanged
class Registry<T> {
  private static _instance: Registry<unknown>;
  static getInstance<T>(): Registry<T> {
    return (Registry._instance ??= new Registry()) as Registry<T>;
  }
}

const stringRegistry = Registry.getInstance<string>();
const numberRegistry = Registry.getInstance<number>();

// Both call sites wrote DIFFERENT type arguments -- are they different objects?
console.log('stringRegistry === numberRegistry:', stringRegistry === numberRegistry);

// A more concrete demonstration: extend Registry with a mutable slot,
// write through the "string" view, read through the "number" view.
class DataRegistry<T> {
  private static _instance: DataRegistry<unknown>;
  value: unknown;
  static getInstance<T>(): DataRegistry<T> {
    return (DataRegistry._instance ??= new DataRegistry()) as DataRegistry<T>;
  }
}

const asString = DataRegistry.getInstance<string>();
asString.value = 'hello'; // written through the "string" typed view

const asNumber = DataRegistry.getInstance<number>();
console.log('read through the "number" view:', asNumber.value); // 'hello' -- a string!
// TypeScript's own type for asNumber.value claims this is "unknown" (from the
// private field's declared type), but nothing ever converted the actual
// string 'hello' into a number -- the "number" call site got the exact
// same object with the exact same string still sitting in it.
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Before running the second demo block, predict what `asNumber.value` will log. Then explain why nothing in the code path from `asString.value = \'hello\'` to reading `asNumber.value` ever performs a string-to-number conversion.',
    hint: 'getInstance<T> only decides what TYPE the caller sees — it does not create a new object per T, and the type assertion `as DataRegistry<T>` has no runtime effect at all.',
    solution: `asNumber.value logs 'hello' -- the plain string, completely unconverted.

There is no conversion step anywhere in this path because
getInstance<number>() never creates a new DataRegistry -- the
??= only runs its right-hand side ONCE, on the very first call
(which happened to be getInstance<string>()). Every subsequent
call, including getInstance<number>(), just returns that same
cached object. The "as DataRegistry<T>" cast is purely a
compile-time instruction to the type checker; it emits zero
JavaScript and performs zero validation or conversion on the
actual value.

The practical lesson: a generic type parameter on a method like
this does NOT give you per-type storage isolation. If you need
genuinely separate instances per type, you need a Map keyed by
some runtime identifier for the type (e.g. a string tag or the
constructor function itself) -- the type parameter T alone
provides no such separation at runtime.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`Registry.getInstance<string>()` and `Registry.getInstance<number>()` return two logically separate Registry instances, one specialized for strings and one for numbers.',
      reality: 'they return the literal same object reference — the `??=` singleton pattern creates the instance once, on whichever call happens first, and every subsequent call with any `<T>` returns that same cached object.',
    },
    {
      thought: 'the `as Registry<T>` cast performs some kind of runtime check or conversion to make the returned object genuinely match the requested type `T`.',
      reality: 'a TypeScript type assertion (`as X`) compiles to zero runtime code — it only changes what the type CHECKER believes about a value, with no effect whatsoever on the actual object at runtime.',
    },
    {
      thought: 'since generics are erased at runtime, a generic type parameter on a method like `getInstance<T>` can\'t possibly cause any observable behavioral bug — "erasure" sounds like it just means "harmless."',
      reality: 'erasure means exactly the opposite of harmless here — because there is no runtime T, nothing prevents data written through one "typed" view of a shared singleton from being read, completely unconverted, through another "differently typed" view of the same object.',
    },
  ];
}
