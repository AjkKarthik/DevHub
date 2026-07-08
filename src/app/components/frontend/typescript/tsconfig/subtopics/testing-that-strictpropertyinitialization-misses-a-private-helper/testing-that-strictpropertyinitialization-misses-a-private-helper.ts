import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-strictpropertyinit-misses-helper-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-strictpropertyinitialization-misses-a-private-helper.html',
  styleUrl: './testing-that-strictpropertyinitialization-misses-a-private-helper.scss',
})
export class TestingThatStrictpropertyinitializationMissesAPrivateHelperSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Three Examples, All Direct Assignment',
      points: [
        'The Strict mode sub-flags tab shows exactly three ways to satisfy <code>strictPropertyInitialization</code>: initialize in the DECLARATION (<code>name3: string = \'\'</code>), suppress the check with <code>!</code> (<code>name2!: string</code>), or — implicitly — assign directly inside the constructor body. All three are DIRECT, syntactically visible assignments.',
        'This subtopic tests a FOURTH pattern the page never shows: initializing the field inside a PRIVATE HELPER METHOD called from the constructor, rather than directly in the constructor\'s own body. Does TypeScript trace the call to know the field ends up initialized?',
      ],
    },
    {
      heading: 'Why TypeScript Doesn\'t Trace Into Called Methods',
      points: [
        '<code>strictPropertyInitialization</code> performs a SYNTACTIC check of the constructor body — it looks for a direct <code>this.field = value</code> assignment statement (or an equivalent it can trivially prove always runs) written literally inside the constructor. It does not perform interprocedural control-flow analysis into arbitrary called methods.',
        'This means <code>constructor() { this.setup(); } private setup() { this.name = \'x\'; }</code> — a completely correct, safe pattern where the field genuinely IS initialized before the constructor returns — still gets flagged as "Property \'name\' has no initializer and is not definitely assigned in the constructor," because TypeScript never looks inside <code>setup()</code> to see that it assigns <code>this.name</code>.',
        'This is a well-known, deliberate limitation, not a bug: full interprocedural analysis would be prohibitively expensive and could produce false negatives just as easily (e.g., if <code>setup()</code> were later changed to skip the assignment under some condition). The common workarounds are the definite-assignment assertion (<code>!</code>) or restructuring to assign directly in the constructor.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "strictPropertyInitialization": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>strictPropertyInitialization and private helpers</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own three DIRECT-assignment patterns -- all compile cleanly
class DirectAssignment {
  name: string;
  constructor() {
    this.name = 'direct'; // TypeScript sees this literal assignment -- OK
  }
}

class DeclarationInit {
  name: string = ''; // OK -- initialized in the declaration itself
}

class AssertedInit {
  name!: string; // OK -- the ! tells TypeScript "trust me"
}

// This subtopic's test: initialization via a PRIVATE HELPER METHOD,
// which genuinely does run before the constructor returns
class HelperAssignment {
  name: string; // Does this compile, given that setup() below assigns it?

  constructor() {
    this.setup();
  }

  private setup(): void {
    this.name = 'assigned via helper'; // genuinely runs, but TS can't see it from here
  }
}

const h = new HelperAssignment();
console.log('h.name at runtime:', h.name); // 'assigned via helper' -- it DID work
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Check the StackBlitz editor for a red squiggle on the `name: string;` line inside `HelperAssignment`. Read the exact error. Then confirm that h.name still logs the correct value when the code actually runs.',
    hint: 'The compile error and the correct runtime behavior are not contradictory -- TypeScript\'s syntactic check is simply more conservative than what the code actually, safely does.',
    solution: `TypeScript flags "name: string;" inside HelperAssignment with:
"Property 'name' has no initializer and is not definitely assigned
in the constructor." -- even though setup() unconditionally runs
and assigns it before the constructor finishes.

Despite the compile error, running the code (if you force it past
the type error, or check it in a JS-only context) shows h.name
correctly logs 'assigned via helper' -- the runtime behavior is
completely safe. The error is a FALSE POSITIVE from TypeScript's
perspective, caused by the syntactic (not semantic) nature of the
check.

The three fixes available: (1) add the definite-assignment assertion
(name!: string) if you're confident the helper always initializes
it; (2) restructure to assign directly in the constructor body
(this.name = this.computeName();); or (3) give the field a
placeholder default (name: string = '';) and let setup() overwrite
it -- all three satisfy the syntactic check without changing the
actual runtime behavior.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`strictPropertyInitialization` performs genuine control-flow analysis, tracing through every method call the constructor makes to verify a field is eventually assigned before the constructor returns.',
      reality: 'the check only looks for a DIRECT assignment statement written literally inside the constructor body — it does not trace into private helper methods, even ones that unconditionally run and correctly initialize the field.',
    },
    {
      thought: 'the main page\'s three examples (declaration init, `!` assertion, direct constructor assignment) are just illustrative — any reasonable way of ensuring a field gets initialized before use will satisfy the check.',
      reality: 'those three ARE, specifically, the only patterns TypeScript syntactically recognizes — a helper-method pattern that is EQUALLY safe at runtime still fails the check, because the check is syntactic, not semantic.',
    },
    {
      thought: 'a `strictPropertyInitialization` error always indicates a genuine, real bug where a field might be read before it has a value.',
      reality: 'it can be a false positive for code that is fully safe at runtime but structured in a way (indirection through a helper method) the syntactic check does not recognize — the error signals "TypeScript cannot verify this," not "this is definitely wrong."',
    },
  ];
}
