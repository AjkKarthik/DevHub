import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-spyon-calls-through',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './spyon-calls-through.html',
  styleUrl: './spyon-calls-through.scss'
})
export class SpyOnCallsThroughSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the Challenge relies on",
      "points": [
        "The Challenge solution does <code>const saveSpy = jest.spyOn(fakeStore, \"save\")</code>, calls <code>svc.charge(50, \"4111\")</code>, and asserts both <code>saveSpy</code> was called once and <code>fakeStore.getAll()</code> has length 1.",
        "Measured with the jest-mock package (30.5): after <code>spyOn(store, \"save\")</code>, calling <code>store.save(1)</code> added the item and recorded one call. After adding <code>mockImplementation(() =&gt; {})</code>, the next call was recorded but nothing was added.",
        "So the receipt only reaches the fake store because spyOn calls through. If someone \"cleans up\" the test by adding a no-op implementation, the call-count assertion still passes but the length assertion fails.",
        "This is also why the Spy tab adds <code>mockImplementation(() =&gt; {})</code>: there the real <code>send</code> would send an email, so replacing it is the point. Same API, opposite intent."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured with jest-mock",
      "language": "typescript",
      "code": "import { ModuleMocker } from 'jest-mock';\nconst m = new ModuleMocker(globalThis);\n\nconst store = { items: [] as number[], save(r: number) { this.items.push(r); } };\nconst spy = m.spyOn(store, 'save');\n\nstore.save(1);\n// items.length 1, spy.mock.calls.length 1   (called through)\n\nspy.mockImplementation(() => {});\nstore.save(2);\n// items.length still 1, spy.mock.calls.length 2  (recorded, not run)"
    },
    {
      "label": "The Challenge, broken by a no-op",
      "language": "typescript",
      "code": "const fakeStore = new InMemoryReceiptStore();\nconst saveSpy = jest.spyOn(fakeStore, 'save').mockImplementation(() => {});\n\nnew PaymentService(gwStub, fakeStore).charge(50, '4111');\n\nexpect(saveSpy).toHaveBeenCalledTimes(1);     // passes\nexpect(fakeStore.getAll()).toHaveLength(1);    // fails: received length 0"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Given that spyOn calls through, is the <code>saveSpy</code> assertion in the Challenge needed at all? What does it add that <code>fakeStore.getAll()</code> does not?",
    "hint": "Think about what the fake can and cannot tell you about how it was used.",
    "solution": "The state check already proves a receipt was saved. The spy adds the exact number of calls and the arguments, so it would catch the service saving the same receipt twice through another path, but for this test the state assertion is the stronger one. Many teams would keep only the state check and drop the spy."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>jest.spyOn</code> replaces the method with an empty function.",
      "reality": "By default it wraps the original and still calls it. Only <code>mockImplementation</code> or <code>mockReturnValue</code> replace the behaviour."
    },
    {
      "thought": "If the call count is right, the side effect happened.",
      "reality": "A spy with a replaced implementation records the call even though the real side effect never ran."
    }
  ];
}
