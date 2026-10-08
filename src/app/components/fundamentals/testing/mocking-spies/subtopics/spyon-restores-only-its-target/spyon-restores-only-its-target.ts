import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-spyon-restores-only-its-target',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './spyon-restores-only-its-target.html',
  styleUrl: './spyon-restores-only-its-target.scss'
})
export class SpyOnRestoresOnlyItsTargetSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What jest.spyOn replaces",
      "points": [
        "<code>jest.spyOn(mathUtils, \"random\")</code> replaces the <code>random</code> property on the <code>mathUtils</code> object with a mock function. <code>Math.random</code> is a different property on a different object and stays untouched.",
        "So <code>mockRestore()</code> puts back the original <code>mathUtils.random</code> arrow function. The page's comment said it put back <code>Math.random</code>; it now names the right target.",
        "The distinction matters as soon as the code under test calls <code>Math.random()</code> directly. Spying on a wrapper only helps if the code goes through that wrapper.",
        "The same reasoning explains why spying on a module export sometimes has no effect: if the module under test captured the original function in a local variable, replacing the property afterwards does not change that variable."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Two different targets",
      "language": "typescript",
      "code": "const mathUtils = { random: () => Math.random() };\n\nconst spy = jest.spyOn(mathUtils, 'random').mockReturnValue(0.5);\nmathUtils.random();   // 0.5 (spied)\nMath.random();        // still random: Math was not touched\nspy.mockRestore();    // restores mathUtils.random\n\nconst mathSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);\nMath.random();        // 0.5\nmathSpy.mockRestore();"
    },
    {
      "label": "Captured reference",
      "language": "typescript",
      "code": "// dice.ts\nimport { mathUtils } from './mathUtils';\nconst rand = mathUtils.random;          // captured at import time\nexport const roll = () => Math.floor(rand() * 6) + 1;\n\n// dice.test.ts\njest.spyOn(mathUtils, 'random').mockReturnValue(0);\nroll();   // still random: dice.ts kept the original function"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Rewrite the \"Captured reference\" dice module so that a spy on <code>mathUtils.random</code> does affect <code>roll()</code>.",
    "hint": "Look up the method on the object at call time instead of at import time.",
    "solution": "export const roll = () => Math.floor(mathUtils.random() * 6) + 1; Reading mathUtils.random inside roll means each call sees whatever is currently on the object, including the spy."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Spying on any function that calls <code>Math.random</code> also mocks <code>Math.random</code>.",
      "reality": "A spy replaces one property on one object. Other references to the original function are unaffected."
    },
    {
      "thought": "<code>mockRestore</code> resets global state.",
      "reality": "It only puts back the property the spy replaced."
    }
  ];
}
