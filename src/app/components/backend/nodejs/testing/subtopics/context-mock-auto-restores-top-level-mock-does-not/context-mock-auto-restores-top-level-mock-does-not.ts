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
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './context-mock-auto-restores-top-level-mock-does-not.html',
  styleUrl: './context-mock-auto-restores-top-level-mock-does-not.scss'
})
export class ContextMockAutoRestoresTopLevelMockDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'node:test\'s per-test t.mock auto-restores; the top-level mock import does not',
      points: [
        'The main page\'s own quick reference lists node:test as a dependency-free built-in test runner, without covering its mocking API in any depth. node:test (Node 18+) exposes mocking through two different entry points that behave very differently around cleanup: the per-test context\'s t.mock (a MockTracker available as the mock property on the TestContext passed into every test callback), and the top-level mock object imported directly from node:test.',
        'Node\'s own documentation states this directly for context-scoped mocking: "the test runner will automatically restore all mocked functionality once the test finishes." Using t.mock.method(obj, "someMethod", ...) inside a test callback means that once that specific test completes, Node itself restores the original method — no .mock.restore() call, no afterEach hook, no cleanup code of any kind required.',
        'The top-level mock import has no such automatic behavior. import { mock } from "node:test" gives you a MockTracker that persists across the whole file/process until you explicitly call mock.reset() or mock.restoreAll() — functionally closer to Jest\'s default behavior, where jest.restoreAllMocks() (or configuring restoreMocks: true) has to be invoked, typically in an afterEach hook, or mocked state leaks between tests.',
      ]
    },
    {
      heading: 'Why the distinction matters in practice',
      points: [
        'Mixing the two mock sources in the same file is a real, easy mistake: reaching for the top-level mock import out of habit (or because it\'s the first thing autocomplete suggests) means every mock set up that way needs its own explicit cleanup — forgetting it produces the exact same kind of test-order-dependent pollution the main page\'s own "Not clearing mocks between tests" mistake describes for Jest, just via a different API.',
        'Preferring t.mock (the per-test context version) over the top-level mock import, whenever a test doesn\'t genuinely need a mock to survive past its own test function, removes an entire category of cleanup bugs by construction — there is no afterEach to forget, because Node\'s own test runner guarantees the restoration itself.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 't.mock — auto-restored when this specific test finishes',
      language: 'typescript',
      code: `import { test } from 'node:test';
import assert from 'node:assert';
import * as mathUtils from './math-utils.js';

test('square uses the mocked multiply', (t) => {
  // t.mock is scoped to THIS test only.
  const multiplySpy = t.mock.method(mathUtils, 'multiply', () => 42);

  const result = mathUtils.square(5);

  assert.strictEqual(result, 42);
  assert.strictEqual(multiplySpy.mock.calls.length, 1);
  // No t.mock.restoreAll() needed here — Node restores
  // mathUtils.multiply to its real implementation automatically
  // the moment this test function returns.
});

test('square uses the REAL multiply in this later test', () => {
  // No mocking setup at all — and none is needed, because the
  // previous test's mock was already cleaned up automatically.
  const result = mathUtils.square(5);
  assert.strictEqual(result, 25); // the real implementation
});`,
    },
    {
      label: 'Top-level mock — persists until you clean it up yourself',
      language: 'typescript',
      code: `import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert';
import * as mathUtils from './math-utils.js';

// Forgetting this line means the mock set up below LEAKS into
// every subsequent test in the file — the top-level mock object
// has no automatic per-test restoration of its own.
afterEach(() => {
  mock.restoreAll();
});

test('square uses the mocked multiply', () => {
  mock.method(mathUtils, 'multiply', () => 42);

  const result = mathUtils.square(5);

  assert.strictEqual(result, 42);
  // Without the afterEach above, mathUtils.multiply would still
  // be mocked to return 42 for every test that runs after this one.
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A node:test file has two tests. The first uses t.mock.method(logger, "warn", () => {}) to silence a noisy warning while asserting some unrelated behavior. The second test, later in the same file, asserts that calling a function actually triggers logger.warn() with a specific message — but the assertion fails, because logger.warn appears to still be silenced by the first test\'s mock. What is actually going on, and how would switching which mocking API the first test uses fix it?',
    hint: 'Does t.mock.method() clean itself up automatically, the way this subtopic\'s theory describes — or does the described symptom (a mock leaking into a later test) sound more like behavior of the OTHER mocking API this subtopic covers?',
    solution: 'If t.mock.method() were genuinely used in the first test, this leak could not happen — Node\'s own documentation guarantees the per-test context mock tracker automatically restores all mocked functionality once that specific test finishes, with no manual cleanup required. Since logger.warn is still mocked/silenced in the second test, what actually happened is the first test used the top-level mock import (import { mock } from "node:test") instead of the per-test t.mock, and never called mock.restoreAll() (either inline or in an afterEach) to clean it up — the top-level mock object has no automatic per-test restoration, so its mocked state persists across every subsequent test in the file until explicitly reset. The fix is switching the first test to use its own t.mock.method(logger, "warn", () => {}) instead of the top-level mock.method(...) call — since t.mock is scoped to that individual test, Node will restore logger.warn to its real implementation automatically the moment the first test completes, and the second test\'s assertion on the real logger.warn behavior will pass without needing any explicit afterEach cleanup at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since t.mock and the top-level mock import both come from the same node:test module and provide the same mock.method()/mock.fn() API, they behave identically — cleanup works the same way regardless of which one a test uses.',
      reality: 'This subtopic\'s theory and first two code examples both show this is not the case — t.mock (the per-test TestContext mock tracker) auto-restores when its own test finishes, per Node\'s own documented guarantee, while the top-level mock import persists globally until mock.reset() or mock.restoreAll() is called explicitly.'
    },
    {
      thought: 'Using node:test\'s built-in mocking always requires an afterEach cleanup hook, the same way Jest typically does, since that is the general pattern for test mocking libraries.',
      reality: 'This subtopic\'s first code example shows the opposite — using t.mock (rather than the top-level mock import) specifically removes the need for any afterEach cleanup at all, because Node\'s own test runner handles the restoration automatically once that individual test completes.'
    },
    {
      thought: 'A mock set up with the top-level mock import in one test automatically has no effect on other tests in the same file, since node:test presumably isolates each test\'s state the same way t.mock does.',
      reality: 'This subtopic\'s exercise shows the opposite — the top-level mock import\'s state is NOT test-scoped, so a mock left uncleaned by one test genuinely leaks into and affects every subsequent test in the same file until mock.restoreAll() is explicitly called.'
    }
  ];
}
