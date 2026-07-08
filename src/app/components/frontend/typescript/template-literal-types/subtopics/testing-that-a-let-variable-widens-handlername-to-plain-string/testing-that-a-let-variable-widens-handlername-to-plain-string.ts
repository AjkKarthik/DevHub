import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-let-widens-handlername-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-let-variable-widens-handlername-to-plain-string.html',
  styleUrl: './testing-that-a-let-variable-widens-handlername-to-plain-string.scss',
})
export class TestingThatALetVariableWidensHandlernameToPlainStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Two Separate Claims, Combined',
      points: [
        'The Event Handler Generation tab shows <code>type HandlerName = \`on${Capitalize&lt;DOMEvent&gt;}\`</code> producing the specific union <code>\'onClick\' | \'onFocus\' | ...</code>. Separately, Common Mistake #2 warns that <code>Capitalize&lt;string&gt;</code> (the broad type, not a literal) just produces <code>string</code> — no useful narrowing.',
        'The page never connects these two facts through a GENERIC function call. This subtopic builds one — <code>function makeHandlerName&lt;E extends string&gt;(e: E): \`on${Capitalize&lt;E&gt;}\`</code> — and tests what happens when the argument passed in is a plain <code>let</code> variable instead of a literal.',
      ],
    },
    {
      heading: 'Why let vs const Changes What E Gets Inferred As',
      points: [
        'TypeScript "widens" the inferred type of a <code>let</code> variable initialized with a string literal to the broad <code>string</code> type — <code>let e = \'click\'</code> gives <code>e: string</code>, not <code>e: \'click\'</code>. A <code>const</code> binding, by contrast, keeps the narrow literal type: <code>const e = \'click\'</code> gives <code>e: \'click\'</code>.',
        'When <code>makeHandlerName(e)</code> is called with a widened <code>let</code> variable, TypeScript infers the generic <code>E</code> from the ARGUMENT\'S TYPE, which is already <code>string</code>. So <code>E = string</code>, and the return type collapses to <code>\`on${Capitalize&lt;string&gt;}\`</code> = <code>\`on${string}\`</code> — a broad, near-useless type that accepts any string starting with "on", not the specific literal <code>\'onClick\'</code> a reader might expect.',
        'No error is raised anywhere in this chain. The function signature, the call, and the resulting type are all completely valid TypeScript — the specificity is lost silently, purely as a consequence of how the caller happened to declare their variable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>let widening and template literal types</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// A generic version of the main page's HandlerName pattern
function makeHandlerName<E extends string>(e: E): \`on\${Capitalize<E>}\` {
  return ('on' + e.charAt(0).toUpperCase() + e.slice(1)) as \`on\${Capitalize<E>}\`;
}

// Case 1: a const, literal-typed argument -- E is inferred as the literal 'click'
const literalResult = makeHandlerName('click');
console.log('literal call result:', literalResult); // 'onClick'

// A helper that only compiles if its argument is assignable to the exact literal 'onClick'
function assertIsOnClick<T extends 'onClick'>(val: T): T { return val; }
assertIsOnClick(literalResult); // does this compile?

// Case 2: a let variable -- TypeScript WIDENS its type to plain string
let widenedEvent = 'click'; // inferred type: string, NOT 'click'
const widenedResult = makeHandlerName(widenedEvent);
console.log('widened call result:', widenedResult); // still 'onClick' at runtime!

// assertIsOnClick(widenedResult);
// Uncomment above -- does the WIDENED call's result still satisfy
// the exact 'onClick' check, or has the TYPE become too broad?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `assertIsOnClick(widenedResult);`. Read the exact compiler error. Then explain why widenedResult still logs the correct string \'onClick\' at runtime despite the type-level rejection.',
    hint: 'Widening only affects what TypeScript BELIEVES the type is — the actual runtime string computation inside makeHandlerName never changes; only the compiler\'s ability to narrow the RETURN type changes.',
    solution: `Uncommenting assertIsOnClick(widenedResult) fails to compile:
"Argument of type '\`on\${string}\`' is not assignable to parameter of
type 'onClick'." -- confirming widenedResult's TYPE is the broad
\`on\${string}\`, not the specific literal 'onClick', purely because
widenedEvent was declared with let.

At runtime, widenedResult still holds the correct string 'onClick'
-- the widening is a purely TYPE-LEVEL phenomenon. The function's
actual JavaScript logic (string concatenation) runs identically
regardless of how the caller's variable was declared; only
TypeScript's STATIC type for the result changes.

The practical fix: declare event-name variables with const, or
annotate the let variable's type explicitly with the narrower
literal type (let widenedEvent: 'click' = 'click'), or use as const
on a literal value assigned to let where applicable.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a generic function like `makeHandlerName<E extends string>` always infers `E` as the SPECIFIC literal value passed at the call site, regardless of how the caller\'s variable was declared.',
      reality: 'TypeScript infers `E` from the ARGUMENT\'S OWN TYPE — a `let` variable initialized with a string literal is widened to plain `string`, so `E` is inferred as `string`, not the literal, even though the runtime value passed is still the specific string.',
    },
    {
      thought: 'this kind of widening would surface as a compile error somewhere, alerting the caller that they lost type specificity.',
      reality: 'no error occurs anywhere — `E extends string` accepts `string` just fine, and `\`on${Capitalize<string>}\`` = `\`on${string}\`` is a completely valid, if much broader, type; the loss of specificity is silent.',
    },
    {
      thought: 'the main page\'s Common Mistake #2 ("Capitalize<string> just produces string") only matters when someone explicitly writes `Capitalize<string>` by hand.',
      reality: 'it also happens implicitly, through ordinary generic type inference, any time a generic parameter constrained to `string` receives an argument whose type was already widened to `string` rather than kept as a literal.',
    },
  ];
}
