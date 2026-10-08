import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-expect-assertions-exact',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './expect-assertions-exact.html',
  styleUrl: './expect-assertions-exact.scss'
})
export class ExpectAssertionsExactSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Exactly, not at least",
      "points": [
        "The quiz answer was \"Fails if fewer than 2 assertions ran\" and its explanation said the test fails \"if exactly n assertions didn't run\". Those are two different rules.",
        "Checked with Jest 30's <code>expect</code> package: after <code>expect.assertions(2)</code> and three assertions, the recorded error was \"Expected two assertions to be called but received three assertion calls.\" After one assertion it was \"...but received one assertion call.\" Both fail.",
        "So the count is exact. That is useful for catching a branch that silently skips its <code>expect</code>, but it also means adding an assertion to the test needs the number updated.",
        "When you only care that the assertion inside a <code>catch</code> or callback actually ran, <code>expect.hasAssertions()</code> says that directly and does not need updating."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "import { expect } from 'expect';   // jest 30.5\n\nexpect.assertions(2);\nexpect(1).toBe(1); expect(2).toBe(2); expect(3).toBe(3);\nexpect.extractExpectedAssertionsErrors();\n// 'Expected two assertions to be called but received three assertion calls.'\n\nexpect.assertions(2);\nexpect(1).toBe(1);\nexpect.extractExpectedAssertionsErrors();\n// 'Expected two assertions to be called but received one assertion call.'"
    },
    {
      "label": "Choosing between them",
      "language": "typescript",
      "code": "test('rejects with a useful message', async () => {\n  expect.hasAssertions();          // at least one must run\n  try {\n    await badFn();\n  } catch (e) {\n    expect((e as Error).message).toBe('fail');\n  }\n});\n\n// Simpler still: no counting needed\ntest('rejects with a useful message', async () => {\n  await expect(badFn()).rejects.toThrow('fail');\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test calls <code>expect.assertions(3)</code>, then loops over an array of results and asserts on each one. The array has 3 items today. What happens next month when a fourth result is added?",
    "hint": "Count the expect calls the loop makes.",
    "solution": "The loop makes four assertions, so the test fails with \"Expected three assertions to be called but received four assertion calls\" even though every result is correct. Either compute the count from the array (expect.assertions(results.length)) or use expect.hasAssertions()."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>expect.assertions(n)</code> is a minimum.",
      "reality": "It is an exact count. More assertions than n fail the test just like fewer do."
    },
    {
      "thought": "You need <code>expect.assertions</code> for every async test.",
      "reality": "It matters when an assertion could be skipped, such as inside a catch block. <code>await expect(p).rejects</code> avoids the problem entirely."
    }
  ];
}
