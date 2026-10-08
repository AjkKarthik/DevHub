import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-in-source-tests-define',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './in-source-tests-define.html',
  styleUrl: './in-source-tests-define.scss'
})
export class InSourceTestsDefineSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Runs never, ships anyway",
      "points": [
        "Vitest sets <code>import.meta.vitest</code> while it runs tests. A normal production build does not set it, so at runtime the property is undefined and an <code>if (import.meta.vitest)</code> block is skipped.",
        "The problem is the bundle, not behaviour. The bundler cannot know at build time that the property will be undefined, so it keeps the block and everything it references.",
        "The Vitest guide fixes this with <code>define: { \"import.meta.vitest\": \"undefined\" }</code>. The build replaces the expression with <code>undefined</code>, the condition becomes <code>if (undefined)</code>, and the minifier removes the block as dead code.",
        "The page's mistake said the property \"remains truthy in production\", and its fix used the JavaScript value <code>undefined</code> instead of the string <code>\"undefined\"</code>. Both are corrected."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Source with in-source tests",
      "language": "typescript",
      "code": "export function clamp(n: number, min: number, max: number) {\n  return Math.min(Math.max(n, min), max);\n}\n\nif (import.meta.vitest) {\n  const { it, expect } = import.meta.vitest;\n  it('clamps', () => expect(clamp(11, 0, 10)).toBe(10));\n}"
    },
    {
      "label": "Build config",
      "language": "typescript",
      "code": "/// <reference types=\"vitest/config\" />\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n  define: {\n    'import.meta.vitest': 'undefined',   // string: inserted as code\n  },\n  test: {\n    includeSource: ['src/**/*.ts'],      // tells Vitest to run them\n  },\n});\n\n// After define:  if (undefined) { ... }  -> removed by the minifier"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Without the <code>define</code>, does a production user ever run the in-source test code? What is the actual cost of forgetting it?",
    "hint": "Separate what executes from what is downloaded.",
    "solution": "No: import.meta.vitest is undefined outside Vitest, so the if block never executes. The cost is bundle size: the test code, plus any helpers or fixtures it imports, is still shipped and parsed by every user."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Forgetting the define makes in-source tests run in production.",
      "reality": "They do not run; they are just not removed from the bundle."
    },
    {
      "thought": "The define value can be the JavaScript value <code>undefined</code>.",
      "reality": "Vite inserts define values as code, so the documented form is the string <code>\"undefined\"</code>."
    }
  ];
}
