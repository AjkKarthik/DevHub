import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-invocation-call-order',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './invocation-call-order.html',
  styleUrl: './invocation-call-order.scss'
})
export class InvocationCallOrderSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "A global sequence number per call",
      "points": [
        "The mistake \"Checking calls but not order\" is right that <code>toHaveBeenCalled()</code> says nothing about order. Its fix wires both mocks through a third <code>order</code> mock with <code>mockImplementation</code>.",
        "Every Jest mock function already records <code>mock.invocationCallOrder</code>: one number per call, taken from a counter shared by all mocks. A smaller number means an earlier call.",
        "Measured with jest-mock 30.5: calling <code>B()</code> then <code>A()</code> gave <code>B.mock.invocationCallOrder</code> of <code>[9]</code> and <code>A.mock.invocationCallOrder</code> of <code>[10]</code>. The absolute values depend on earlier calls in the file; only the comparison is meaningful.",
        "The jest-extended library wraps this as <code>expect(mockA).toHaveBeenCalledBefore(mockB)</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Built-in approach",
      "language": "typescript",
      "code": "test('saves before notifying', async () => {\n  const save = jest.fn();\n  const notify = jest.fn();\n\n  await new OrderService(save, notify).place('Widget');\n\n  const [saveOrder] = save.mock.invocationCallOrder;\n  const [notifyOrder] = notify.mock.invocationCallOrder;\n  expect(saveOrder).toBeLessThan(notifyOrder);\n});"
    },
    {
      "label": "With jest-extended",
      "language": "typescript",
      "code": "import 'jest-extended';\n\nexpect(save).toHaveBeenCalledBefore(notify);"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A mock <code>log</code> is called three times and <code>flush</code> once. How do you assert that <code>flush</code> ran after every <code>log</code> call?",
    "hint": "invocationCallOrder is an array with one entry per call.",
    "solution": "expect(flush.mock.invocationCallOrder[0]).toBeGreaterThan(Math.max(...log.mock.invocationCallOrder)); The flush call number must be larger than the largest log call number."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Jest has no built-in way to check call order across mocks.",
      "reality": "Each mock records <code>mock.invocationCallOrder</code> from a shared counter, which is enough to compare order."
    },
    {
      "thought": "The order numbers start at 1 in each test.",
      "reality": "They come from a counter shared across the file, so only comparisons between numbers are reliable."
    }
  ];
}
