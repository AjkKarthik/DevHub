import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-counterreducer-return-type-catches-gaps-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-counterreducers-explicit-return-type-catches-gaps.html',
  styleUrl: './testing-that-counterreducers-explicit-return-type-catches-gaps.scss',
})
export class TestingThatCounterreducersExplicitReturnTypeCatchesGapsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Reducer Has No Default Case',
      points: [
        'The React hooks tab defines <code>type CounterAction = { type: \'increment\' } | { type: \'decrement\' } | { type: \'reset\'; payload: number }</code> and a <code>counterReducer</code> whose <code>switch</code> handles all three cases with no <code>default</code> branch and no <code>satisfies never</code> exhaustiveness check at the end.',
        'This subtopic tests what happens when <code>CounterAction</code> later gains a FOURTH member that the reducer\'s <code>switch</code> is never updated to handle — a very common way reducers silently rot as an app grows. Does anything in the page\'s existing code structure catch this, given the reducer never adds an explicit exhaustiveness guard?',
      ],
    },
    {
      heading: 'Why the Explicit Return Type Annotation Alone Is Enough',
      points: [
        'The main page\'s own reducer signature is <code>(state: number, action: CounterAction): number =&gt; { switch (...) { ... } }</code> — note the explicit <code>: number</code> return type annotation. This is doing more protective work than it might look like.',
        'When a <code>switch</code> statement has no <code>default</code> case and a new union member is added without a matching <code>case</code>, execution can fall through the entire switch without hitting any <code>return</code> statement — the function would implicitly return <code>undefined</code> for that input at runtime. TypeScript\'s ordinary function-body checking (independent of any opt-in strict flag) flags this as "Function lacks ending return statement and return type does not include \'undefined\'," because the declared return type <code>number</code> does not permit an implicit <code>undefined</code>.',
        'This means the reducer IS already protected against a newly-added, unhandled action type — not through an exhaustiveness pattern like <code>action satisfies never</code> in a default branch (which the page never adds), but simply because it declared an explicit return type that excludes <code>undefined</code>. Removing that explicit <code>: number</code> annotation would silently remove this protection.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Reducer exhaustiveness via return type</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own CounterAction and counterReducer, unchanged --
// but with a FOURTH action member added that the switch never handles
type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number }
  | { type: 'double' }; // NEW -- added, but no case for it below

const counterReducer = (state: number, action: CounterAction): number => {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'reset':     return action.payload;
    // no case for 'double' -- and no default branch either
  }
};

console.log(counterReducer(5, { type: 'increment' })); // 6

// Now compare: remove the explicit ": number" return type annotation
// and see whether the SAME missing-case problem is still caught
const counterReducerNoAnnotation = (state: number, action: CounterAction) => {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'reset':     return action.payload;
    // still no case for 'double'
  }
};
console.log(counterReducerNoAnnotation(5, { type: 'increment' })); // 6
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Look for a red squiggle on `counterReducer`\'s declaration in the editor. Is there one? Now check `counterReducerNoAnnotation` — does it also get flagged, or does removing the `: number` annotation make the same gap silent?',
    hint: 'The explicit return type tells TypeScript what every code path MUST produce -- without it, TypeScript just infers whatever the function happens to return, including an implicit undefined for the unhandled case.',
    solution: `counterReducer is flagged: "Function lacks ending return statement
and return type does not include 'undefined'." -- the explicit
: number annotation is exactly what catches the newly added,
unhandled 'double' case, with no exhaustiveness pattern needed in
the switch itself.

counterReducerNoAnnotation compiles with ZERO error. Without the
explicit return type, TypeScript infers the function's return type
FROM its body -- which becomes number | undefined (since falling
through the switch implicitly returns undefined). Because
undefined is now part of the INFERRED return type, there's nothing
left to violate.

The practical lesson: an explicit, narrow return type annotation on
a reducer (or any function with a switch over a union) is not just
documentation -- it is an active, meaningful exhaustiveness check
that catches unhandled union members as your action types grow,
with zero extra syntax needed beyond the annotation itself.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s `counterReducer`, since its `switch` has no `default` case and no `satisfies never` exhaustiveness pattern, provides no protection against a newly-added, unhandled action type.',
      reality: 'the explicit `: number` return type annotation on the reducer already provides exactly that protection — a code path that falls through without returning is flagged as producing an implicit `undefined`, which conflicts with the declared `number` return type.',
    },
    {
      thought: 'removing an explicit return type annotation from a function is purely a style choice with no effect on type safety, since TypeScript infers the return type either way.',
      reality: 'for a function like this reducer, removing the explicit annotation genuinely REMOVES a real safety check — the inferred return type silently WIDENS to include `undefined` once a code path can fall through, exactly masking the gap the explicit annotation would have caught.',
    },
    {
      thought: 'the ONLY way to get exhaustiveness checking on a switch over a discriminated union is the `action satisfies never` (or similar) pattern in a default branch.',
      reality: 'a sufficiently narrow explicit return type annotation on the enclosing function is an alternative, simpler mechanism that catches the same class of gap — for a case like this reducer, no dedicated exhaustiveness pattern is even needed.',
    },
  ];
}
