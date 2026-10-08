import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-backslash-s-in-template',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './backslash-s-in-template.html',
  styleUrl: './backslash-s-in-template.scss'
})
export class BackslashSInTemplateSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Escapes inside a template literal",
      "points": [
        "The page stores code samples in backtick template literals. In JavaScript, <code>\\s</code> is not a recognised escape sequence, so inside a template literal it is replaced by the plain character <code>s</code>. Node prints <code>`/\\s+/g`</code> as <code>/s+/g</code>.",
        "So the Challenge displayed <code>p.name.toLowerCase().replace(/s+/g, \"-\")</code>. That regex matches runs of the letter s, not whitespace.",
        "Run on the Challenge's own input, <code>\"Widget Pro\"</code>, the displayed code returns <code>\"widget pro\"</code>. The solution's inline snapshot expects <code>\"slug\": \"widget-pro\"</code>, so anyone who copied the code would see the snapshot fail.",
        "The page now writes <code>\\\\s</code> in its source, and evaluating the stored starter code as a template literal gives back <code>replace(/\\s+/g, \"-\")</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "What happened",
      "language": "typescript",
      "code": "// In the .ts file:   code: `... .replace(/\\s+/g, '-') ...`\n// What readers saw:  .replace(/s+/g, '-')\n\n'Widget Pro'.toLowerCase().replace(/s+/g, '-');    // 'widget pro'\n'Widget Pro'.toLowerCase().replace(/\\s+/g, '-');   // 'widget-pro'"
    },
    {
      "label": "Fixed Challenge code",
      "language": "typescript",
      "code": "function formatProduct(p: { name: string; price: number }) {\n  return {\n    slug: p.name.toLowerCase().replace(/\\s+/g, '-'),\n    displayPrice: `$${p.price.toFixed(2)}`,\n    label: `${p.name} — $${p.price.toFixed(2)}`,\n  };\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A code sample stored in a template literal contains <code>/^\\d{3}-\\d{4}$/</code>. What do readers see, and does that regex still match <code>555-1234</code>?",
    "hint": "\\d is not a template-literal escape either.",
    "solution": "Readers see /^d{3}-d{4}$/, which matches the literal text ddd-dddd. It does not match 555-1234. The source needs \\\\d so that one backslash survives."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "An unknown escape in a template literal is a syntax error.",
      "reality": "Only malformed escapes such as an incomplete \\u or \\x are errors. Others like \\s just lose the backslash."
    },
    {
      "thought": "A wrong regex in a code sample would be obvious from the snapshot.",
      "reality": "Only if someone runs it. The displayed code looked plausible, and the snapshot in the solution was written by hand."
    }
  ];
}
