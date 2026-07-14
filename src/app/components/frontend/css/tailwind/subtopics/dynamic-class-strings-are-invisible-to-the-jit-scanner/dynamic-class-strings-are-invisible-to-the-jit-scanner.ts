import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dynamic-class-strings-are-invisible-to-the-jit-scanner.html',
  styleUrl: './dynamic-class-strings-are-invisible-to-the-jit-scanner.scss',
})
export class DynamicClassStringsAreInvisibleToTheJitScannerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Tailwind\'s JIT engine is a plain-text scanner, not a JavaScript interpreter — it never actually RUNS your code to see what class names result',
      points: [
        'At build time, JIT reads every file listed in <code>content</code> as raw TEXT and looks for substrings that match a valid utility class pattern — it does not execute any JavaScript, so it has no way to know what a template literal like <code>`bg-${color}-500`</code> would evaluate to at runtime.',
        'The literal characters <code>bg-${color}-500</code> never match any real utility class name, so the scanner simply never generates CSS for it — this is true no matter how "obviously correct" the resulting runtime string would be if you ran the JavaScript yourself.',
      ]
    },
    {
      heading: 'The failure is completely silent — no build error, no runtime error, just a missing style',
      points: [
        'The build succeeds normally. The JavaScript runs fine and correctly computes the string <code>"bg-blue-500"</code> at runtime. The <code>className</code> attribute is set correctly in the DOM.',
        'But because <code>bg-blue-500</code> was never generated as a CSS rule (since the scanner never saw that literal text anywhere in the source files), the element simply renders with NO background color at all — indistinguishable from a typo, but caused by something that looks like completely correct, working code.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Silent Failure',
      language: 'typescript',
      code: `// Angular component — looks completely correct, runs without error
@Component({
  template: \`<div [class]="colorClass">Status badge</div>\`
})
class BadgeComponent {
  @Input() color: 'blue' | 'red' | 'green' = 'blue';

  get colorClass(): string {
    // This JavaScript is 100% correct and produces the right string at runtime.
    return \`bg-\${this.color}-500\`;
  }
}

// At runtime: colorClass correctly evaluates to "bg-blue-500".
// The DOM correctly has class="bg-blue-500" on the div.
// ... but the element renders with NO background color at all.

// Why: Tailwind's JIT scanner reads badge.component.ts as raw TEXT
// during the BUILD, looking for literal class-name-shaped substrings.
// The literal text in this file is: \`bg-\${this.color}-500\`
// That string never matches any real utility class -- "bg-blue-500"
// as a complete, literal substring never appears ANYWHERE in the
// source files, so the scanner never generates that CSS rule.
// No build error. No runtime error. Just a missing style.`,
    },
    {
      label: 'The Fix — Always Include Complete Class Name Strings',
      language: 'typescript',
      code: `// Fix: use a lookup object so every complete class name
// literally appears as text somewhere in the source file.
@Component({
  template: \`<div [class]="colorClass">Status badge</div>\`
})
class BadgeComponent {
  @Input() color: 'blue' | 'red' | 'green' = 'blue';

  private readonly colorClasses: Record<string, string> = {
    blue:  'bg-blue-500',   // <-- literal, complete string the scanner CAN see
    red:   'bg-red-500',
    green: 'bg-green-500',
  };

  get colorClass(): string {
    return this.colorClasses[this.color];
  }
}

// Now "bg-blue-500", "bg-red-500", and "bg-green-500" all appear as
// literal, complete substrings directly in this file's source text --
// the JIT scanner finds all three and generates CSS for each one,
// regardless of which one is actually selected at runtime.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate insists the bug can\'t be a Tailwind scanning issue, since they added <code>console.log(colorClass)</code> and it printed the exact string <code>"bg-blue-500"</code> in the browser console. Are they right to rule out JIT scanning as the cause?',
    hint: 'Ask WHEN the JIT scanner runs relative to when that console.log actually executes — build time vs. runtime.',
    solution: 'They\'re not right to rule it out — the console.log proves the JAVASCRIPT correctly computed the string at runtime, but the JIT scanner already finished its work at BUILD time, before any of this code ever ran. The scanner only ever saw the literal, unexecuted source text (`bg-${this.color}-500`), never the runtime-evaluated result. A correct runtime value and a missing CSS rule are not contradictory — they\'re exactly what this bug looks like.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If the JavaScript correctly computes the right class name string at runtime (confirmed by logging it), Tailwind must be generating the corresponding CSS somewhere.',
      reality: 'Tailwind\'s JIT scanner runs at BUILD time and only reads literal, unexecuted source text — it has no visibility into what a template literal or function call evaluates to at runtime. A correct runtime string and a missing CSS rule can coexist perfectly, since they come from two completely different points in time.'
    },
    {
      thought: 'This only affects unusual, complex dynamic class construction — a simple template literal like `bg-${color}-500` is common enough that Tailwind must special-case it somehow.',
      reality: 'There is no special-casing. The scanner treats every file as plain text and looks for literal substrings — it makes no exception for template literals, string concatenation, or any other JavaScript construct that LOOKS like it should obviously work.'
    },
    {
      thought: 'Since this bug produces no error message anywhere (build or runtime), it must be genuinely rare or an edge case unlikely to actually happen in real projects.',
      reality: 'It is one of the most common real Tailwind bugs in dynamic, data-driven UIs — any component computing a class name from a variable (a status color, a size prop, a theme value) is at risk unless every possible complete class string appears literally somewhere in the source, exactly as the main page\'s own mistake describes.'
    }
  ];
}
