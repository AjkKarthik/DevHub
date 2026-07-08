import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-partial-record-safe-optional-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-partial-record-of-literal-keys-is-safely-optional.html',
  styleUrl: './testing-that-partial-record-of-literal-keys-is-safely-optional.scss',
})
export class TestingThatPartialRecordOfLiteralKeysIsSafelyOptionalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Different Record Shapes on the Same Page',
      points: [
        'Common Mistake #3 shows a real unsafe hole: <code>const map: Record&lt;string, User&gt; = {}; const user = map[\'nonexistent\']; user.name;</code> compiles with NO error — TypeScript assumes every string key exists and types the result as <code>User</code>, not <code>User | undefined</code>.',
        'Separately, the String Utility Types tab defines <code>HandlerMap&lt;Events&gt; = Partial&lt;Record&lt;\`on${Capitalize&lt;Events&gt;}\`, (event: Event) =&gt; void&gt;&gt;</code> and only assigns <code>onClick</code>, leaving <code>onFocus</code>/<code>onBlur</code> unset. This subtopic tests whether THAT record — a <code>Partial&lt;Record&lt;LiteralUnion, V&gt;&gt;</code> — has the same unsafe hole as the bare <code>Record&lt;string, User&gt;</code> example, or whether it is genuinely different.',
      ],
    },
    {
      heading: 'Why the Two Records Behave Differently',
      points: [
        '<code>Record&lt;string, User&gt;</code> is an INDEX SIGNATURE — <code>{ [key: string]: User }</code>. TypeScript\'s index signatures do not carry per-key presence information; by design (without <code>noUncheckedIndexedAccess</code>), any string key access is typed as the value type, full stop.',
        '<code>Record&lt;\'onClick\' | \'onFocus\' | \'onBlur\', V&gt;</code> (a LITERAL union key) is instead a set of individual mapped PROPERTIES — <code>{ onClick: V; onFocus: V; onBlur: V }</code> — not an index signature. Wrapping it in <code>Partial&lt;...&gt;</code> genuinely adds <code>?</code> to each of those individual properties: <code>{ onClick?: V; onFocus?: V; onBlur?: V }</code>.',
        'Accessing an OPTIONAL property (<code>?:</code>) is always typed as <code>V | undefined</code> by TypeScript, with no special flag required — this is completely different machinery from the index-signature gap that <code>noUncheckedIndexedAccess</code> exists to patch. The two Record examples on this page look similar but rest on entirely different type-system features.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Record index signature vs literal-key Partial</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `interface User { name: string }

// The main page's Common Mistake #3 -- the UNSAFE hole
const map: Record<string, User> = {};
const user = map['nonexistent'];
console.log('typeof user (no runtime type check, just JS):', typeof user); // 'undefined'
// user.name would compile with NO error here, then crash at runtime --
// TypeScript's static type for "user" is User, not User | undefined.

// The main page's String Utility Types HandlerMap -- literal-key Partial<Record<...>>
type DOMHandlers = Partial<Record<'onClick' | 'onFocus' | 'onBlur', (e: Event) => void>>;
const handlers: DOMHandlers = {
  onClick: (e) => console.log('clicked', e),
  // onFocus and onBlur intentionally left unset
};

// Does accessing an unset handler get flagged safely, unlike the Record<string, User> case?
handlers.onFocus; // what TYPE does TypeScript infer here?
// handlers.onFocus(new Event('focus'));
// Uncomment the line above -- does it compile, or does TypeScript
// correctly demand a null check first?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `handlers.onFocus(new Event(\'focus\'))`. Read the exact compiler error. Then explain, in one sentence, why `map[\'nonexistent\'].name` from the Common Mistake #3 example does NOT get the same protection.',
    hint: 'One is a mapped set of individually optional properties; the other is a plain index signature with no per-key presence tracking at all.',
    solution: `Uncommenting handlers.onFocus(...) gives: "Cannot invoke an object
which is possibly 'undefined'." -- TypeScript correctly demands a
null check (handlers.onFocus?.(...) or an if-guard) before calling it.

map['nonexistent'].name does NOT get this protection because
Record<string, User> compiles to an index signature ({ [key: string]:
User }), which by design types every possible string key as User with
no undefined branch -- unless the separate noUncheckedIndexedAccess
tsconfig flag is enabled. Partial<Record<LiteralUnion, V>> instead
produces individually optional PROPERTIES, which TypeScript always
types as V | undefined when accessed, with no extra flag needed.

The practical lesson: Record<string, T> (open string keys) and
Record<SomeLiteralUnion, T> (closed literal keys) look like the same
utility but have fundamentally different safety characteristics once
you wrap the latter in Partial.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`Record<string, User>` and `Partial<Record<\'a\' | \'b\', User>>` are the same kind of type with the same safety characteristics, just with different key sets.',
      reality: '`Record<string, User>` compiles to an index signature with no per-key presence tracking; `Record<\'a\' | \'b\', User>` compiles to individual mapped properties, which `Partial` can genuinely mark as optional (`?:`), giving real `| undefined` typing on access.',
    },
    {
      thought: 'the `Record<string, User>` unsafe-access hole from Common Mistake #3 applies to every use of `Record` on this page, including the `HandlerMap` example.',
      reality: 'the hole is specific to OPEN string-keyed (or number-keyed) index signatures — `Record` with a literal union key is a completely different, closed shape not subject to that gap at all.',
    },
    {
      thought: 'you need `noUncheckedIndexedAccess` enabled for TypeScript to correctly flag access to an unset property anywhere in a `Record`-based type.',
      reality: '`noUncheckedIndexedAccess` only affects INDEX SIGNATURE access (`Record<string, T>`, `T[]`, etc.) — optional properties from `Partial<Record<LiteralUnion, T>>` are already safely typed as `T | undefined` without that flag, by ordinary optional-property rules.',
    },
  ];
}
