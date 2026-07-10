import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-celsius-field-decorator-construction-only-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-celsius-field-decorator-only-validates-construction.html',
  styleUrl: './testing-that-celsius-field-decorator-only-validates-construction.scss',
})
export class TestingThatCelsiusFieldDecoratorOnlyValidatesConstructionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Comment',
      points: [
        'The TC39 Field &amp; Accessor Decorators tab shows <code>@range(-273.15, 1e9) celsius: number = 0;</code> on a plain FIELD (not an <code>accessor</code>), followed by the comment <code>t.celsius = 100; // OK</code> and <code>// t.celsius = -300; // RangeError: celsius must be between -273.15 and 1000000000</code> — implying the validation runs on every later assignment, just like a setter would.',
        'This subtopic tests that literal claim: does reassigning <code>t.celsius</code> AFTER construction actually trigger the <code>range</code> decorator\'s validation, or does the validation only ever run once, during the initial field setup?',
      ],
    },
    {
      heading: 'Why Field Decorators Only Wrap the INITIAL Value',
      points: [
        'A TC39 field decorator\'s returned function becomes the field\'s INITIALIZER — it runs exactly once per instance, at construction time, to compute the value assigned to <code>celsius: number = 0</code> from the right-hand side expression. It has no ongoing relationship to the field afterward.',
        'A plain class field (declared without the <code>accessor</code> keyword) is, once constructed, just an ordinary OWN DATA PROPERTY on the instance — assigning <code>t.celsius = -300</code> later is a completely normal property write with no getter/setter installed, so there is nothing left to intercept the new value.',
        'The <code>range</code> decorator SHOULD, and DOES, correctly reject an out-of-range value provided in the field\'s own initializer (<code>celsius: number = -500</code> at construction time throws). But it provides ZERO protection for any assignment made after the instance already exists — exactly the gap the accessor-based <code>readonly</code> decorator right below it in the same code tab is built differently to avoid, by using <code>get</code>/<code>set</code> traps that intercept EVERY access.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Field decorators and post-construction assignment</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own range field decorator, unchanged
function range(min: number, max: number) {
  return function(_target: undefined, context: ClassFieldDecoratorContext) {
    return function(this: unknown, value: number) {
      if (value < min || value > max) {
        throw new RangeError(
          \`\${String(context.name)} must be between \${min} and \${max}\`
        );
      }
      return value;
    };
  };
}

class Temperature {
  @range(-273.15, 1e9)
  celsius: number = 0;
}

// Construction-time validation -- this DOES correctly throw
try {
  class BadInitial {
    @range(-273.15, 1e9)
    celsius: number = -500; // out of range in the initializer itself
  }
  new BadInitial();
  console.log('BadInitial construction did NOT throw (unexpected)');
} catch (e) {
  console.log('BadInitial construction correctly threw:', (e as Error).message);
}

// The main page's own claim -- does THIS actually throw?
const t = new Temperature();
t.celsius = 100; // the page's own comment says "OK"
console.log('after t.celsius = 100:', t.celsius);

t.celsius = -300; // the page's own comment says this throws a RangeError
console.log('after t.celsius = -300 (no crash above this line?):', t.celsius);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Run the demo. Does the program crash on `t.celsius = -300`, or does it print a value below -273.15 with no error at all? Compare that outcome against the BadInitial try/catch block just above it.',
    hint: 'The decorator only ever runs as part of computing the field\'s OWN initializer value at construction time -- a plain field has no getter/setter to intercept a LATER assignment.',
    solution: `The program does NOT crash on t.celsius = -300 -- it logs "after
t.celsius = -300: -300", a value far outside the declared -273.15 to
1e9 range, with zero error or warning anywhere.

Compare this to the BadInitial block just above it, which correctly
throws "celsius must be between -273.15 and 1000000000" -- because
THAT violation happened in the field's own initializer expression
(celsius: number = -500), which is exactly the one place the range
decorator's returned function actually runs.

The main page's own comment for this exact code
("t.celsius = -300; // RangeError...") describes accessor-decorator
behavior, not plain-field-decorator behavior. To get validation on
EVERY assignment (not just construction), the field would need to be
declared with the accessor keyword instead -- exactly like the
readonly accessor decorator shown right below range in the same
code tab, which correctly intercepts every set via a real setter
trap.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a TC39 field decorator like `@range(min, max)` validates every future assignment to that field, the same way a property setter would.',
      reality: 'a field decorator\'s returned function only ever runs ONCE, as the field\'s initializer at construction time — a plain field (without `accessor`) has no getter/setter installed afterward, so later assignments bypass the decorator entirely.',
    },
    {
      thought: 'the main page\'s own inline comment for this exact code (`t.celsius = -300; // RangeError...`) accurately describes what the code does.',
      reality: 'that comment describes ACCESSOR-decorator behavior (which does intercept every set) applied to a PLAIN field decorator (which only intercepts construction) — the two decorator kinds have genuinely different runtime hooks, and this example uses the one that does not validate reassignment.',
    },
    {
      thought: 'if a decorated field correctly rejects an invalid value in one context (construction), it will behave consistently and reject the same invalid value in any other context (reassignment).',
      reality: 'field decorators and accessor decorators are fundamentally different mechanisms with different interception points — consistency across contexts is not guaranteed, and choosing the wrong one for a given use case (validation-on-every-set) silently produces no protection at all outside that one interception point.',
    },
  ];
}
