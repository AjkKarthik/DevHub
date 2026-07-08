import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-excess-property-checking-arguments-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-excess-property-checking-applies-to-function-arguments-too.html',
  styleUrl: './testing-that-excess-property-checking-applies-to-function-arguments-too.scss',
})
export class TestingThatExcessPropertyCheckingAppliesToFunctionArgumentsTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the main page says — and what it doesn\'t quite say',
      points: [
        'The main topic\'s "Structural typing" section describes excess property checking with an assignment example: <code>const p: Point = { x: 1, y: 2, z: 3 }</code> errors, but <code>const obj = {...}; const p: Point = obj;</code> does not — because the object goes through an intermediate variable first. That is accurate, but it frames the check as something that happens specifically at <em>variable assignment</em>.',
        'TypeScript\'s excess property check actually fires anywhere a <strong>fresh object literal</strong> is checked against a target type — and a function call argument is exactly that kind of position. <code>distanceFromOrigin({ x: 1, y: 2, z: 3 })</code> is checked the same way as <code>const p: Point = { x: 1, y: 2, z: 3 }</code>, because in both cases TypeScript sees a literal being written directly into a typed slot.',
      ],
    },
    {
      heading: 'Why "fresh literal" is the real rule, not "assignment"',
      points: [
        'The precise rule: excess property checking applies to object literals that are <em>freshly created</em> at the point TypeScript checks them against a target type — whether that target is a variable\'s declared type, a function parameter\'s type, a return type, or an array/tuple element type. The moment the literal passes through a variable first, it stops being "fresh" and the check no longer applies — that is the actual mechanism behind the assignment example on the main page, not something specific to assignment itself.',
        'This matters in practice: a common bug pattern is a typo\'d property name in a function call — <code>createUser({ nmae: "Alice", age: 30 })</code> — which TypeScript catches immediately as an excess (and, here, effectively missing) property error, exactly because the object literal is passed directly as the argument rather than through a variable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Excess property checking</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `interface Point { x: number; y: number }

function distanceFromOrigin(p: Point): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

// ── Case 1: the main page's own example — assignment ────────────────────────
const p1: Point = { x: 1, y: 2 };              // OK
// const p2: Point = { x: 1, y: 2, z: 3 };     // uncomment: excess property error on 'z'

const raw = { x: 1, y: 2, z: 3 };
const p3: Point = raw;                          // OK — 'raw' isn't a fresh literal anymore

// ── Case 2: the SAME check at a function call site ──────────────────────────
console.log(distanceFromOrigin({ x: 3, y: 4 }));           // OK
// console.log(distanceFromOrigin({ x: 3, y: 4, z: 5 }));  // uncomment: SAME excess property error, at the call site

// ── Case 3: routing through a variable defeats the check here too ───────────
const maybeExtra = { x: 3, y: 4, z: 5 };
console.log(distanceFromOrigin(maybeExtra));    // OK — no longer a fresh literal, so no excess-property check

// ── Case 4: the realistic bug this check actually catches ───────────────────
interface NewUser { name: string; age: number }
function createUser(u: NewUser): string {
  return \`\${u.name} (\${u.age})\`;
}
// console.log(createUser({ nmae: "Alice", age: 30 }));  // uncomment: caught immediately — typo'd property name
console.log(createUser({ name: "Alice", age: 30 }));      // OK
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the three commented-out lines in the playground above, one at a time. For each, read the exact TypeScript error message in the editor — does it call out the SAME kind of problem ("excess property"), or something different, for the assignment case versus the function-call case?',
    hint: 'Compare the error TypeScript reports for the commented `p2` line against the error for the commented `distanceFromOrigin({...z:5})` line — check whether both mention "excess property" specifically.',
    solution: `Both the assignment case (const p2: Point = { x, y, z }) and the
function-call case (distanceFromOrigin({ x, y, z })) report the
SAME category of error: "Object literal may only specify known
properties, and 'z' does not exist in type 'Point'." TypeScript
does not treat these as different situations — both are a fresh
object literal being checked directly against a target type, which
is precisely the condition that triggers the check, regardless of
whether that target is a variable's type annotation or a function
parameter's type.

The createUser({ nmae: ... }) line demonstrates why this matters in
real code: a typo in a property name passed directly as a call
argument is caught immediately, in the exact same way a typo in an
object literal being assigned to a typed variable would be.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'excess property checking is specifically an "assignment-time" check — it only fires when using <code>const x: T = {...}</code> syntax.',
      reality: 'the real trigger is a <em>fresh object literal</em> being checked directly against a target type — that happens at variable assignment, but equally at function call arguments, return statements, and array/tuple positions. Assignment is just the most common example, not the boundary of the rule.',
    },
    {
      thought: 'if a function\'s parameter type doesn\'t explicitly forbid extra properties, passing an object with extra properties as an argument is always safe.',
      reality: 'passing a FRESH literal with extra properties directly as an argument is caught by excess property checking, exactly like the assignment case — it is only safe once the object has been assigned to a variable first (or has a wider, explicitly compatible type).',
    },
    {
      thought: 'routing an object through an intermediate variable to "get around" excess property checking is a workaround or a loophole.',
      reality: 'it is the intended, documented way structural typing and excess property checking interact — the check exists specifically to catch typos in literals written at the point of use, not to restrict genuinely wider objects being passed around a codebase.',
    },
  ];
}
