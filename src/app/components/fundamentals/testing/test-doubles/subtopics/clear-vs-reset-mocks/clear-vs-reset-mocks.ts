import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-clear-vs-reset-mocks',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './clear-vs-reset-mocks.html',
  styleUrl: './clear-vs-reset-mocks.scss'
})
export class ClearVsResetMocksSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Three different resets",
      "points": [
        "The page's \"Not resetting mocks between tests\" mistake recommends <code>beforeEach(() =&gt; { jest.clearAllMocks(); })</code>. That is the right fix for leaking call counts, as the mistake describes.",
        "Measured with jest-mock 30.5: a function set up with <code>mockReturnValue({ success: true })</code> and called once had 0 recorded calls after <code>clearAllMocks()</code>, and still returned <code>{ success: true }</code>.",
        "After <code>resetAllMocks()</code> the same function returned <code>undefined</code>: its canned return value was removed as well. After <code>restoreAllMocks()</code>, a method wrapped with <code>spyOn</code> was replaced by the original function again.",
        "This matters when the double is configured once and shared. A module-level <code>const gw = jest.fn().mockReturnValue(...)</code> survives <code>clearAllMocks</code>, but under <code>resetAllMocks</code> every later test would see <code>undefined</code> unless it sets the value again."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "import { ModuleMocker } from 'jest-mock';\nconst m = new ModuleMocker(globalThis);\n\nconst gw = m.fn().mockReturnValue({ success: true });\ngw();\n\nm.clearAllMocks();\n// gw.mock.calls.length -> 0\n// gw()                 -> { success: true }   (behaviour kept)\n\nm.resetAllMocks();\n// gw()                 -> undefined           (behaviour removed)"
    },
    {
      "label": "Config equivalents",
      "language": "typescript",
      "code": "// jest.config.ts\nexport default {\n  clearMocks: true,     // jest.clearAllMocks() before every test\n  // resetMocks: true,  // jest.resetAllMocks() before every test\n  // restoreMocks: true // jest.restoreAllMocks() before every test\n};"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A file declares <code>const priceStub = jest.fn().mockReturnValue(10)</code> at the top and has <code>resetMocks: true</code> in its Jest config. The first test expects a total of 30 for quantity 3. What total does it get, and what are two ways to fix it?",
    "hint": "resetMocks runs before each test, including the first.",
    "solution": "The stub returns undefined after the reset, so the total is NaN (undefined * 3). Fix by moving mockReturnValue(10) into a beforeEach or into the test itself, or by switching the config to clearMocks: true, which forgets calls but keeps the return value."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>clearAllMocks</code>, <code>resetAllMocks</code> and <code>restoreAllMocks</code> are interchangeable.",
      "reality": "Clear forgets calls, reset also forgets canned behaviour, restore also puts original methods back for spies."
    },
    {
      "thought": "Resetting more is always safer.",
      "reality": "Resetting more removes setup that tests may rely on. Use the weakest reset that keeps tests independent."
    }
  ];
}
