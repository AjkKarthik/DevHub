import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-greet-empty-string-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-greet-with-an-empty-string-does-not-say-hello-stranger.html',
  styleUrl: './testing-that-greet-with-an-empty-string-does-not-say-hello-stranger.scss',
})
export class TestingThatGreetWithAnEmptyStringDoesNotSayHelloStrangerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s "Logical Narrowing" Example',
      points: [
        'The "Control Flow Analysis" code tab includes: <code>function greet(name?: string) { const msg = name && `Hello, ${name}!`; return msg ?? \'Hello, stranger!\'; }</code> — with comments "name narrowed in &&" and "?? removes null/undefined." Both comments are individually accurate descriptions of what each operator does.',
        'What the comments don\'t address is the combined behavior for one specific input: an empty string. <code>name?: string</code> means <code>name</code> can legitimately be <code>""</code> (a caller explicitly passing an empty string is different from passing nothing at all) — this subtopic tests what <code>greet("")</code> actually returns.',
      ],
    },
    {
      heading: 'Tracing Through the Empty-String Case',
      points: [
        'When <code>name</code> is <code>""</code>, the expression <code>name && \`Hello, ${name}!\`</code> short-circuits: <code>&&</code> evaluates its left side, finds it falsy (empty string IS falsy), and returns that left side AS-IS — <code>""</code> — without ever evaluating the template literal on the right. So <code>msg</code> becomes <code>""</code>, not <code>undefined</code>.',
        'Then <code>msg ?? \'Hello, stranger!\'</code> runs — but <code>??</code> (nullish coalescing) ONLY substitutes its right side when the left is <code>null</code> or <code>undefined</code>. <code>""</code> is neither, so <code>??</code> passes it through unchanged. The final result of <code>greet("")</code> is <code>""</code> — an empty string, not the friendly "Hello, stranger!" fallback the function\'s overall design seems to intend for a "no real name" case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>greet("") — tracing the empty-string case</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's exact greet function
function greet(name?: string) {
  const msg = name && \`Hello, \${name}!\`;
  return msg ?? 'Hello, stranger!';
}

console.log(JSON.stringify(greet('Alice')));    // "Hello, Alice!"
console.log(JSON.stringify(greet(undefined)));  // "Hello, stranger!" -- undefined correctly falls back
console.log(JSON.stringify(greet()));           // "Hello, stranger!" -- no argument, also falls back
console.log(JSON.stringify(greet('')));         // "" -- an EMPTY STRING, not "Hello, stranger!"

// ── Tracing exactly why ──────────────────────────────────────────────────
const name = '';
const msg = name && \`Hello, \${name}!\`;
console.log('msg after &&:', JSON.stringify(msg));   // "" -- && short-circuits to the falsy left side
console.log('typeof msg:', typeof msg);                // "string" -- not undefined!
const result = msg ?? 'Hello, stranger!';
console.log('final result:', JSON.stringify(result));  // "" -- ?? only replaces null/undefined, not ""

// ── A version that handles empty string too ──────────────────────────────
function greetFixed(name?: string) {
  return name ? \`Hello, \${name}!\` : 'Hello, stranger!';
  // ternary on plain truthiness -- treats "" the same as undefined
}
console.log(JSON.stringify(greetFixed('')));  // "Hello, stranger!" -- now handled
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the playground above, change `const msg = name && ...` to `const msg = name?.length ? \`Hello, ${name}!\` : undefined;` (an alternative that explicitly checks for a non-empty string) and re-run `greet(\'\')`. Does it now return "Hello, stranger!" — and why does this version avoid the bug the original had?',
    hint: 'Check what value `msg` becomes for an empty-string input with this alternative condition, compared to the original `name && ...` version.',
    solution: `Yes — with name?.length ? ... : undefined, an empty string input
gives name.length === 0, which is falsy, so msg becomes undefined
explicitly (not ""). Since ?? DOES replace undefined, greet('') now
correctly returns "Hello, stranger!".

The original version's bug was specifically that && returns its own
left operand when falsy, rather than a fixed sentinel like
undefined — so a falsy STRING input (empty string) produces a falsy
STRING output (still ""), which ?? then lets straight through
unchanged. Any fix needs to ensure the "no real name" case produces
an actual null or undefined for ?? to catch — either by checking
name.length explicitly, or by switching to a plain ternary on
truthiness (as greetFixed does), which doesn't rely on ?? at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'combining `name && ...` with `?? fallback` correctly handles every "no real name" case, including an empty string, because both operators are about "falsy-ness."',
      reality: '&& and ?? check for different things — && short-circuits on ANY falsy value and returns that falsy value itself; ?? only substitutes for null or undefined specifically. Chaining them this way only catches empty string if && happens to produce undefined for it, which it does not.',
    },
    {
      thought: 'a comment like "?? removes null/undefined" on a line of code guarantees the WHOLE expression correctly handles every "absent" case a reader might expect, including falsy-but-defined values like "".',
      reality: 'the comment is accurate about what ?? itself does — it says nothing about what value reaches ?? in the first place, which depends entirely on the earlier && expression\'s own falsy-value semantics.',
    },
    {
      thought: 'an optional string parameter (name?: string) realistically only ever receives a real name or is completely omitted — an explicitly-passed empty string is an edge case not worth designing for.',
      reality: 'form inputs, trimmed strings, and API responses commonly produce empty strings as a normal, expected "no value entered" signal — code that only guards against undefined and not empty string is a common, realistic source of subtly wrong greetings, labels, or messages.',
    },
  ];
}
