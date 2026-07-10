import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-bind-is-permanent-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './bind-is-permanent-a-second-bind-or-call-cant-override.html',
  styleUrl: './bind-is-permanent-a-second-bind-or-call-cant-override.scss',
})
export class BindIsPermanentASecondBindOrCallCantOverrideSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Says "Permanently Bound" — This Tests Whether That Word Is Literal',
      points: [
        'The QnA section says: "bind(ctx) — returns a new permanently-bound function, does NOT invoke." The word "permanently" is a strong claim. This subtopic tests it directly: after calling <code>fn.bind(objA)</code>, what happens if you then try <code>.call(objB)</code> or <code>.bind(objB)</code> on the ALREADY-bound function?',
        'This is a genuinely common real-world trap: a developer might reasonably assume that <code>call</code>/<code>apply</code> can always override <code>this</code> at the call site, not realizing that once a function has been through <code>.bind()</code>, that assumption silently stops being true.',
      ],
    },
    {
      heading: 'Why the Second Binding Attempt Is Ignored',
      points: [
        '<code>fn.bind(objA)</code> doesn\'t modify <code>fn</code> — it creates and returns a BRAND NEW function (technically a "bound function exotic object" per the spec) that, internally, always calls the original <code>fn</code> with <code>this</code> forced to <code>objA</code>, no matter how the new function is itself invoked.',
        'Calling <code>.call(objB)</code> on this new bound function does invoke it with an attempted <code>this = objB</code> — but the bound function\'s own internal logic ignores whatever <code>this</code> it was called with, and calls the ORIGINAL function with the originally-bound <code>objA</code> instead. The <code>this</code> passed to <code>.call()</code> this second time is simply discarded.',
        'Calling <code>.bind(objB)</code> a second time is similar but more subtle: it returns YET ANOTHER new bound function, but that new function still ultimately delegates to the ORIGINAL bound function (which is hardwired to <code>objA</code>) — so even the "re-bound" function still resolves to <code>objA</code> when finally invoked.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>bind() permanence demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function whoAmI(this: { name: string }) {
  return this.name;
}

const objA = { name: 'A' };
const objB = { name: 'B' };

const boundToA = whoAmI.bind(objA);

console.log('boundToA() ->', boundToA());
// Attempt to override with .call(objB) on the ALREADY-bound function:
console.log('boundToA.call(objB) ->', (boundToA as any).call(objB));
// Attempt to override with .apply(objB):
console.log('boundToA.apply(objB) ->', (boundToA as any).apply(objB));
// Attempt to re-bind to objB entirely:
const reboundToB = boundToA.bind(objB as any);
console.log('reboundToB() ->', reboundToB());
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. After boundToA is created with .bind(objA), does .call(objB), .apply(objB), or a second .bind(objB) ever succeed in changing what "this" resolves to?',
    hint: 'Ask whether ANY of the three later attempts (call, apply, a second bind) actually change the returned name away from "A".',
    solution: `Every single line returns "A" -- boundToA(), boundToA.call(objB),
boundToA.apply(objB), and even reboundToB() (the result of calling
.bind(objB) a SECOND time on the already-bound function) all
resolve this.name to "A", never "B".

This confirms the QnA's "permanently bound" claim literally: once a
function has been through .bind(), no later call() attempt, apply()
attempt, or even ANOTHER .bind() call can change which object this
resolves to. The original binding to objA wins every time, no
matter how the resulting bound function is subsequently invoked or
re-wrapped.

This is a genuinely useful, non-obvious fact for real code: if
you're debugging why a .call(newContext) on some function isn't
having the effect you expect, checking whether that function was
ALREADY the result of an earlier .bind() call is a concrete, testable
hypothesis -- bound functions are simply immune to having their
this reassigned by anything after the original bind.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'call() and apply() can always override whatever "this" a function would otherwise use, since they explicitly specify the context at the call site.',
      reality: 'this is true for ORDINARY functions, but not for functions that have already been through .bind() — a bound function ignores any this passed to call()/apply() and always uses its originally-bound context instead.',
    },
    {
      thought: 'calling .bind() a second time on an already-bound function successfully re-binds it to the new target.',
      reality: 'the second .bind() call returns a new wrapper function, but that wrapper still ultimately delegates to the FIRST bound function, which is hardwired to the original target — the net effect is the original binding wins, not the second one.',
    },
    {
      thought: 'the "permanently bound" behavior only matters in contrived examples — real code rarely tries to re-bind an already-bound function.',
      reality: 'this is a realistic trap when a function is bound once (often deep inside a library, a framework\'s internals, or an earlier part of a codebase) and later code — unaware of the earlier binding — tries to use call/apply to set a different context, silently failing with no error or warning.',
    },
  ];
}
