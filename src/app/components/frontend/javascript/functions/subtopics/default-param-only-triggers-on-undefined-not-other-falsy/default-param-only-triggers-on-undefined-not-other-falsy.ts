import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-default-param-only-undefined-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './default-param-only-triggers-on-undefined-not-other-falsy.html',
  styleUrl: './default-param-only-triggers-on-undefined-not-other-falsy.scss',
})
export class DefaultParamOnlyTriggersOnUndefinedNotOtherFalsySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #3 Only Tests null — What About 0, false, and ""?',
      points: [
        'Mistake #3 demonstrates specifically that <code>greet(null)</code> does NOT trigger the default parameter — but it only tests ONE non-undefined falsy value. The quiz question separately confirms "null, 0, false do NOT trigger defaults" in a single sentence, without showing each one individually.',
        'This subtopic runs a default-parameter function against SIX different inputs — undefined, no argument at all, null, 0, false, and "" — logging the actual parameter value received each time, to directly confirm the ONE case (undefined/omitted) that triggers the default versus the FOUR falsy-but-not-undefined cases that don\'t.',
      ],
    },
    {
      heading: 'Why undefined Is the Sole Trigger',
      points: [
        'Default parameters are specified to activate based on a strict, single check: "is this argument\'s value exactly <code>undefined</code>?" — not a general falsy check, and not a <code>null</code>-inclusive check like the nullish coalescing operator <code>??</code> uses.',
        'Omitting an argument entirely and explicitly passing <code>undefined</code> are treated identically by this check — <code>greet()</code> and <code>greet(undefined)</code> both trigger the default, because a missing trailing argument IS <code>undefined</code> from the function\'s perspective.',
        'This is a deliberate, narrower design than <code>??</code> (which the main page elsewhere recommends specifically FOR the null case: <code>name ?? \'World\'</code>) — default parameters and <code>??</code> solve overlapping but not identical problems, and conflating them is exactly the source of Mistake #3\'s bug.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Default parameter trigger conditions</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function describe(value: unknown = 'DEFAULT') {
  return value;
}

console.log('describe() [no argument]        ->', describe());
console.log('describe(undefined)              ->', describe(undefined));
console.log('describe(null)                   ->', describe(null));
console.log('describe(0)                      ->', describe(0));
console.log('describe(false)                  ->', describe(false));
console.log('describe("")                     ->', describe(''));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Of the 6 calls, which ones actually show "DEFAULT" in the output, and which ones show the literal value that was passed?',
    hint: 'Ask specifically whether each value IS the literal undefined, or just falsy — the default parameter check only cares about the first condition.',
    solution: `Only two calls show "DEFAULT": describe() with no argument at all,
and describe(undefined) with undefined passed explicitly. This
confirms omitting an argument and explicitly passing undefined are
treated identically by the default-parameter mechanism.

The other four calls all show their LITERAL passed value, NOT the
default: describe(null) shows null, describe(0) shows 0,
describe(false) shows false, and describe("") shows "" (empty
string). None of these four trigger the default, even though every
one of them is falsy in a boolean context.

This confirms the theory's claim precisely: the default parameter
check is a strict "is this undefined?" test, not a general falsy
check and not a null-inclusive check. This is genuinely easy to get
wrong if you're thinking in terms of ?? (which DOES treat null the
same as undefined) or || (which treats ALL of these six values, plus
NaN, as "needs a default") -- default parameters are the narrowest
of the three mechanisms, triggering on exactly one specific value.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'default parameters trigger for any falsy value passed as an argument — 0, false, "", null, and undefined should all fall back to the default.',
      reality: 'default parameters trigger ONLY when the argument is exactly undefined (or omitted entirely) — 0, false, "", and null all pass through as their literal value, unchanged.',
    },
    {
      thought: 'default parameters and the nullish coalescing operator (??) treat undefined and null identically, since they\'re both "used elsewhere in the codebase for similar defaulting purposes."',
      reality: 'they are genuinely different checks — ?? treats BOTH null and undefined as "use the fallback," while default parameters treat ONLY undefined that way, leaving null to pass through unchanged.',
    },
    {
      thought: 'since JavaScript is generally lenient about type coercion, default parameters probably have some coercion-based leniency too — like treating an empty string as "effectively undefined" for form inputs.',
      reality: 'default parameters have zero coercion or leniency — the check is a strict, spec-defined comparison against the literal undefined value, with no special-casing for any other value, however "empty" or "unset" it might seem semantically.',
    },
  ];
}
