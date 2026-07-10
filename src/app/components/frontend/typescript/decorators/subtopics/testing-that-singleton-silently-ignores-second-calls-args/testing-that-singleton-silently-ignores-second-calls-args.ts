import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-singleton-ignores-second-args-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-singleton-silently-ignores-second-calls-args.html',
  styleUrl: './testing-that-singleton-silently-ignores-second-calls-args.scss',
})
export class TestingThatSingletonSilentlyIgnoresSecondCallsArgsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Singleton, Without Constructor Arguments to Show the Gap',
      points: [
        'The Legacy Decorators tab defines <code>function Singleton&lt;T&gt;(ctor: T): T { let instance: InstanceType&lt;T&gt;; return class extends ctor { constructor(...args) { if (instance) return instance; super(...args); instance = this as InstanceType&lt;T&gt;; } } as T; }</code>, applied to <code>@Singleton class Database { private readonly connectionId = Math.random(); ... }</code>.',
        'Because <code>Database</code>\'s own constructor takes no arguments in the page\'s example, the decorator\'s <code>if (instance) return instance;</code> short-circuit is never visibly tested against a REAL argument. This subtopic adds a constructor parameter and calls <code>new Database(...)</code> twice with different values, to see what happens to the second call\'s argument.',
      ],
    },
    {
      heading: 'Why the Second Constructor Call\'s Arguments Vanish Silently',
      points: [
        'The wrapping constructor is: <code>constructor(...args) { if (instance) return instance; super(...args); instance = this; }</code>. On the FIRST call, <code>instance</code> is undefined, so it falls through to <code>super(...args)</code>, correctly running the real constructor with the given arguments.',
        'On the SECOND (and every later) call, <code>instance</code> is already set, so the function returns EARLY — <code>super(...args)</code> is never reached, meaning the args passed to that call are read into the <code>...args</code> parameter and then simply discarded, never used for anything at all.',
        'This is completely silent — no warning, no error, no different return type. A caller who writes <code>new Database(\'staging-url\')</code> expecting a staging-configured instance, after someone else already called <code>new Database(\'prod-url\')</code> earlier in the program, gets back the FIRST (production) instance with no indication their argument was ignored.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Singleton decorator and discarded constructor args</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own Singleton decorator, unchanged
function Singleton<T extends new (...args: unknown[]) => unknown>(ctor: T): T {
  let instance: InstanceType<T>;
  return class extends ctor {
    constructor(...args: unknown[]) {
      if (instance) return instance;
      super(...args);
      instance = this as InstanceType<T>;
    }
  } as T;
}

// The main page's own Database class, PLUS a constructor argument
// to actually make the discarded-args behavior visible
@Singleton
class Database {
  private readonly connectionId = Math.random();
  constructor(public url: string) {}
  query(sql: string): string { return \`[\${this.url}] \${sql}\`; }
}

const db1 = new Database('prod-db.example.com');
console.log('db1.url:', db1.url);

// A second, LATER call with a DIFFERENT url -- what does this actually construct?
const db2 = new Database('staging-db.example.com');
console.log('db2.url:', db2.url); // does this print staging-db, or prod-db?

console.log('db1 === db2:', db1 === db2); // same object?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Predict db2.url before running the demo. Then add a `console.log(\'constructing with\', args)` line inside the Singleton decorator\'s wrapping constructor, right at the top, and confirm whether it logs for the second call at all.',
    hint: 'The `if (instance) return instance;` line runs BEFORE super(...args) -- once instance is already set, the rest of the constructor body (including anything that would use args) never executes for that call.',
    solution: `db2.url logs 'prod-db.example.com' -- the SAME value as db1.url,
confirming db2 is literally the same object as db1 (db1 === db2 is
true). The 'staging-db.example.com' argument passed to the second
new Database(...) call was silently discarded.

Adding a log statement at the very top of the wrapping constructor
DOES still fire on both calls (the wrapping constructor itself
always runs) -- but a log placed AFTER the "if (instance) return
instance;" line, or inside the original Database constructor body,
only fires on the FIRST call, confirming exactly where execution
stops short for every subsequent call.

This is a real risk with the "class decorator returns a modified
subclass" singleton pattern: any code that assumes "each new X(args)
configures a correctly-parameterized instance" silently breaks the
moment a Singleton-decorated class is involved, with no compiler
warning -- TypeScript's own type signature for the constructor still
advertises accepting a url: string parameter on every call.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s `@Singleton` decorator, since it compiles and runs without error, correctly configures the singleton instance based on whatever arguments the CURRENT `new Database(...)` call provides.',
      reality: 'only the FIRST call\'s arguments ever reach the real constructor — every subsequent call\'s arguments are read into the wrapper\'s `...args` parameter and then silently discarded, with the pre-existing instance returned unchanged.',
    },
    {
      thought: 'if a Singleton-decorated class\'s constructor signature still requires a parameter (like `url: string`), TypeScript will somehow flag or warn about calls whose arguments end up unused.',
      reality: 'TypeScript\'s type checker only verifies that the CALL matches the declared constructor SIGNATURE — it has no way to know that the actual runtime behavior discards those arguments on every call after the first, since that logic lives entirely in the decorator\'s implementation, invisible to the type system.',
    },
    {
      thought: 'this silent-argument-discarding behavior only matters if you genuinely need per-call configuration — for a "pure" singleton with no meaningful constructor arguments (like the main page\'s original example), it is harmless.',
      reality: 'the main page\'s own example happens to have no constructor arguments, which is exactly why this gap stays invisible there — the moment ANY constructor parameter is added (a very common real-world addition, like a config object or connection URL), the discarding behavior becomes a genuine, silent correctness bug.',
    },
  ];
}
