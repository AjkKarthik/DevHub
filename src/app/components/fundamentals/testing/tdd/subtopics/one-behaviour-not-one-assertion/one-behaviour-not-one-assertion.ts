import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-one-behaviour-not-one-assertion',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './one-behaviour-not-one-assertion.html',
  styleUrl: './one-behaviour-not-one-assertion.scss'
})
export class OneBehaviourNotOneAssertionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Where the rule came from and what it means",
      "points": [
        "The TDD page's \"Writing too-large tests\" mistake said the fix was \"one assertion per test; one behaviour per test\". Its own explanation only argued for one behaviour: \"Each test should have one reason to fail.\"",
        "The Testing Fundamentals page says the opposite of the literal rule: multiple related assertions about the same single action are fine. The page now says one behaviour per test, with several assertions allowed.",
        "Checking a returned object usually needs more than one assertion: status, total, and line count together describe one outcome. Splitting those into three tests repeats the same arrange and act three times.",
        "The real smell is a test that performs several actions, or asserts on unrelated outcomes. When it fails, you cannot tell which behaviour broke."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "One behaviour, three assertions",
      "language": "typescript",
      "code": "test('checkout of a two-item cart creates a paid order', () => {\n  const cart = new Cart([{ sku: 'A', price: 10 }, { sku: 'B', price: 5 }]);\n\n  const order = cart.checkout();\n\n  expect(order.status).toBe('paid');\n  expect(order.total).toBe(15);\n  expect(order.lines).toHaveLength(2);\n});"
    },
    {
      "label": "Two behaviours, should be split",
      "language": "typescript",
      "code": "test('cart', () => {\n  const cart = new Cart([]);\n  cart.add({ sku: 'A', price: 10 });\n  expect(cart.total()).toBe(10);           // behaviour 1: adding\n  cart.applyCoupon('HALF');\n  expect(cart.total()).toBe(5);            // behaviour 2: coupons\n});\n\n// Better: test('adding an item increases the total')\n//         test('HALF coupon halves the total')"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test asserts that <code>parseDate(\"2026-10-08\")</code> returns year 2026, month 10, and day 8, using three <code>expect</code> calls. A reviewer asks for three separate tests. Is that an improvement? Explain in one or two sentences.",
    "hint": "Count the actions and the outcomes, not the expect calls.",
    "solution": "No. There is one action (parsing one string) and one outcome (the parsed date), so it is one behaviour. Splitting it repeats the same call three times and gives no clearer failure message. A single toEqual({ year: 2026, month: 10, day: 8 }) would also be fine."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Each test may contain only one <code>expect</code>.",
      "reality": "Each test should check one behaviour. Several assertions about the same outcome keep the test readable and avoid repeating setup."
    },
    {
      "thought": "More, smaller tests are always better.",
      "reality": "Tests that duplicate the same arrange and act only to separate assertions add run time and maintenance without adding information."
    }
  ];
}
