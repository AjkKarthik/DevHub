import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-refactor-drops-empty-guard',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './refactor-drops-empty-guard.html',
  styleUrl: './refactor-drops-empty-guard.scss'
})
export class RefactorDropsEmptyGuardSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Why the guard is not redundant",
      "points": [
        "The page's refactored <code>StringCalculator</code> still starts with <code>if (numbers === \"\") return 0;</code>. It looks like a leftover from the first Green step, so it is tempting to delete during refactoring.",
        "Checked in Node: <code>\"\".split(\",\")</code> returns <code>[\"\"]</code>, an array with one empty string. Mapping that with <code>parseInt(n, 10)</code> gives <code>[NaN]</code>, and the sum becomes <code>NaN</code>.",
        "So without the guard, <code>add(\"\")</code> returns NaN, and the first test written in the Red step, <code>expect(calc.add(\"\")).toBe(0)</code>, fails immediately. That is exactly the refactoring safety net the page describes.",
        "A different refactor removes the special case honestly: parse with <code>Number(n) || 0</code>, which maps the empty string to 0. Measured: that version returns 0 for \"\" and 3 for \"1,2\". The test suite decides whether the new version is acceptable, not the developer's sense of what looks redundant."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "The tempting refactor",
      "language": "typescript",
      "code": "class StringCalculator {\n  add(numbers: string): number {\n    return numbers.split(',').map(n => parseInt(n, 10)).reduce((a, b) => a + b, 0);\n  }\n}\n\n// ''.split(',')          -> ['']\n// [''].map(parseInt)     -> [NaN]\n// add('')                -> NaN\n// expect(calc.add('')).toBe(0)  -> FAILS (received NaN)"
    },
    {
      "label": "A refactor the tests accept",
      "language": "typescript",
      "code": "class StringCalculator {\n  add(numbers: string): number {\n    return numbers.split(',').reduce((sum, n) => sum + (Number(n) || 0), 0);\n  }\n}\n\n// add('')      -> 0\n// add('1,2')   -> 3\n// add('1,2,3') -> 6"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "With the accepted refactor (<code>Number(n) || 0</code>), what does <code>add(\"1,,2\")</code> return, and what does <code>add(\"1,x\")</code> return? Does either result suggest a test you have not written yet?",
    "hint": "Number of an empty string is 0. Number of \"x\" is NaN, and NaN || 0 is 0.",
    "solution": "They return 3 and 1: the empty middle value counts as 0, and \"x\" is silently treated as 0. Neither case has a test, so the behaviour is accidental. Write tests that state what should happen, for example that invalid input throws, before relying on it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Code added during an early Green step is safe to delete once a general solution exists.",
      "reality": "It may still handle an edge case the general solution does not. Keep it until the tests pass without it."
    },
    {
      "thought": "Splitting an empty string gives an empty array.",
      "reality": "In JavaScript <code>\"\".split(\",\")</code> returns <code>[\"\"]</code>, an array with one element."
    }
  ];
}
