import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-toprimitive-hint-context-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './toprimitive-hint-differs-by-coercion-context.html',
  styleUrl: './toprimitive-hint-differs-by-coercion-context.scss',
})
export class ToprimitiveHintDiffersByCoercionContextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Money Example Shows Three Outputs, But Never the Actual hint Value Received',
      points: [
        'The Well-Known Symbols code tab defines <code>[Symbol.toPrimitive](hint)</code> on a <code>Money</code> class and shows three DIFFERENT results — a template literal, multiplication, and a comparison — but the reader never sees what the <code>hint</code> PARAMETER itself actually equals in each case; they only see the final formatted output.',
        'This subtopic logs the raw <code>hint</code> value received on every single call, across five different coercion-triggering operations, to directly map "this JS operation" to "this exact hint string."',
      ],
    },
    {
      heading: 'Three Hints, and Which Operations Send Each One',
      points: [
        'JavaScript passes <code>"string"</code> specifically when converting for string-context operations — template literal interpolation (<code>&#96;${obj}&#96;</code>), explicit <code>String(obj)</code>, and <code>Object.prototype.toString.call</code>-style contexts.',
        'It passes <code>"number"</code> for arithmetic and explicit numeric conversion — subtraction, multiplication, division, unary <code>+</code>, and <code>Number(obj)</code>. Notably, the <code>+</code> BINARY operator (addition) is special: it uses the "default" hint instead, because <code>+</code> is ambiguous between numeric addition and string concatenation.',
        'It passes <code>"default"</code> for operations that don\'t clearly favor either type — the loose equality operator <code>==</code>, the binary <code>+</code> operator, and relational comparisons like <code>&lt;</code>/<code>&gt;</code> (which the Money example\'s <code>price &gt; 10</code> triggers). Most classes implementing <code>Symbol.toPrimitive</code> treat <code>"default"</code> the same as <code>"number"</code>, since that matches how <code>valueOf</code>\'s fallback behavior worked before <code>Symbol.toPrimitive</code> existed.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Symbol.toPrimitive hint demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `class HintLogger {
  [Symbol.toPrimitive](hint: string) {
    console.log('hint received:', hint);
    return hint === 'number' ? 7 : 'seven';
  }
}

const val = new HintLogger();

console.log('--- Template literal (\`\${val}\`) ---');
console.log(\`Value: \${val}\`);

console.log('--- Explicit String(val) ---');
String(val);

console.log('--- Explicit Number(val) ---');
Number(val);

console.log('--- Unary plus (+val) ---');
+val;

console.log('--- Multiplication (val * 2) ---');
(val as any) * 2;

console.log('--- Binary addition (val + 1) ---');
(val as any) + 1;

console.log('--- Loose equality (val == 7) ---');
(val as any) == 7;

console.log('--- Relational comparison (val > 5) ---');
(val as any) > 5;
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. For each of the 8 operations, note the "hint received" value logged just before it. Which operations get "string", which get "number", and which get "default"?',
    hint: 'Ask which operations clearly want text output (string), which clearly want a numeric result (multiplication, unary +), and which are ambiguous between the two (binary +, ==, comparisons).',
    solution: `"string" hint: only the template literal and explicit String(val)
call trigger it — both are unambiguously asking for a text
representation.

"number" hint: explicit Number(val), unary plus (+val), and
multiplication (val * 2) all trigger it — these are unambiguously
numeric operations.

"default" hint: binary addition (val + 1), loose equality
(val == 7), and the relational comparison (val > 5) all trigger it
-- these are the genuinely ambiguous cases. Binary + is ambiguous
because it could mean either string concatenation or numeric
addition depending on the other operand's type; == and relational
comparisons don't have an inherent "this should become a string" or
"this should become a number" bias built into the operator itself.

This matches the theory's claim precisely, and explains something
the main page's own Money example glossed over: price > 10 in that
example gets the "default" hint, NOT "number" -- Money's own
toPrimitive implementation happens to treat "default" the same as
"number" (returning this.amount for both), which is why the output
looked like a number was being compared, but the actual hint value
received was "default", not "number". A class that handled "default"
differently from "number" would behave differently here.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the hint parameter only ever has two possible values, "string" and "number" — "default" is just an informal way of describing one of those two cases.',
      reality: '"default" is a genuinely distinct, third hint value the spec defines specifically for operators (binary +, ==, relational comparisons) that are inherently ambiguous between string and numeric intent — it is not merely an alias for "number".',
    },
    {
      thought: 'binary addition (val + 1) receives the "number" hint, since addition is fundamentally a numeric operation.',
      reality: 'binary + specifically receives the "default" hint, precisely because + is ambiguous — it could mean numeric addition OR string concatenation depending on the other operand, unlike unary + or multiplication which are unambiguously numeric.',
    },
    {
      thought: 'if a class\'s Symbol.toPrimitive implementation only handles the "number" and "string" cases explicitly, the "default" case will simply never be triggered by ordinary code.',
      reality: 'common operations like binary +, ==, and relational comparisons (<, >, <=, >=) all trigger the "default" hint — a toPrimitive implementation that doesn\'t explicitly account for it will fall through to whatever its "default:" or fallback branch does, which may not be the intended behavior.',
    },
  ];
}
